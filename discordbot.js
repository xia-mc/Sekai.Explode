//* Discord.js Bot - by ringoXD -
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
require('colors');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, syslogChannel } = require('./config.json');
const { enableTempLinks } = require('./internal/templinks');
const { Player } = require('discord-player');
process.env['FFMPEG_PATH'] = path.join(__dirname, 'ffmpeg');

//!Load Internal dir code
const { onShutdown } = require('./internal/schedules');
const activity = require('./internal/activity');
const mongodb = require('./internal/mongodb');

mongodb.connectMongoose();

const {
	getDuration,
	saveQueue,
	deleteSavedQueues,
	restoreQueues,
} = require('./util/players');
const { LANG, strFormat } = require('./util/languages');
const { ClientMessageHandler } = require('./internal/messages');
const { CommandManager } = require('./internal/commands');

const creset = '\x1b[0m';
const cgreen = '\x1b[32m';

//!LOGGER
const oWrite = process.stdout.write;
process.stdout.write = function () {
	oWrite.apply(this, arguments);
	fs.appendFileSync('discordbot.log', arguments[0] || '');
};

const oWrite2 = process.stdout.write;
process.stderr.write = function () {
	oWrite2.apply(this, arguments);
	fs.appendFileSync('discordbot.log', arguments[0] || '');
};

//!RUN=======================

console.log(LANG.discordbot.main.botStarting);
fs.readdirSync(path.join(__dirname, 'commands'), {
	withFileTypes: true,
}).forEach((file) => {
	if (!file.isFile() || path.extname(file.name) != '.js') return;
	const cmds = require(path.join(__dirname, 'commands', file.name));
	CommandManager.default.addCommands(cmds);
});

const options = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
	],
	// ws: { properties: { $browser: "Discord iOS" }}
};

console.log(
	cgreen +
		strFormat(LANG.discordbot.main.commandsLoaded, [
			CommandManager.default.size,
		]) +
		creset,
);
const client = new Client(options);
console.log(LANG.discordbot.main.playerLoading);
const player = new Player(client);
player.extractors.loadDefault();
console.log(LANG.discordbot.main.setupActivityCalling);
activity.setupActivity(client);
/** @type {ClientMessageHandler | undefined} */
let messageHandler;

client.on('ready', async (readyClient) => {
	enableTempLinks();
	console.log(
		strFormat(LANG.discordbot.ready.loggedIn, {
			cgreen,
			creset,
			tag: client.user.tag,
		}),
	);
	client.user.setPresence({
		activities: [
			{
				name: LANG.discordbot.ready.presenceNameLoading,
				state: LANG.discordbot.ready.presenceStateLoading,
				type: ActivityType.Playing,
			},
		],
		status: 'dnd',
	});
	console.log(LANG.discordbot.ready.commandsRegistering);
	await CommandManager.default.setClient(client);
	console.log(cgreen + LANG.discordbot.ready.commandsReady + creset);
	const SyslogChannel = client.channels.cache.get(syslogChannel);
	SyslogChannel.send(LANG.discordbot.ready.sysLog);
	restoreQueues(player);
	messageHandler = new ClientMessageHandler(readyClient);
});

onShutdown(async () => {
	const SyslogChannel = client.channels.cache.get(syslogChannel);
	await SyslogChannel.send(LANG.discordbot.shutdown.sysLog);
	console.log('Saving queues');
	for (const [guildId, queue] of player.nodes.cache) {
		console.log(guildId);
		await saveQueue(queue);
	}
	await player.destroy();
	await Promise.all([
		client
			.destroy()
			.then(() =>
				console.log(cgreen + LANG.discordbot.shutdown.loggedOut + creset),
			),
		mongodb.connection.close(),
	]);
});

client.login(token);

client.on('messageCreate', (message) => messageHandler?.handleMessage(message));

//!EVENTS
player.events.on('playerStart', (queue, track) => {
	// we will later define queue.metadata object while creating the queue
	// queue.metadata.channel.send(`**${track.title}**を再生中`);
	queue.metadata.channel.send({
		embeds: [
			{
				title: strFormat(LANG.discordbot.playerStart.playingTrack, [
					'**' +
						strFormat(LANG.common.message.playerTrack, {
							title: track.title,
							duration: getDuration(track),
						}) +
						'**',
				]),
				thumbnail: {
					url: track.thumbnail,
				},
				footer: {
					text: strFormat(LANG.discordbot.playerStart.requestedBy, [
						queue.currentTrack.requestedBy.tag,
					]),
				},
				color: 0x5865f2,
			},
		],
	});
});

player.events.on('playerFinish', (queue) => deleteSavedQueues(queue.guild.id));
player.events.on('queueDelete', (queue) => deleteSavedQueues(queue.guild.id));

player.on('error', () => console.log(LANG.discordbot.playerError.message));

process.on('uncaughtException', function (err) {
	console.error(err);
});
