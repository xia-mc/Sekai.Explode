const { SlashCommandBuilder, ChannelType, RoleSelectMenuComponent } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Lookup Server/User Info')
		.addSubcommand(subcommand =>
            subcommand
                .setName('user')
				.setDescription('ユーザーの情報を調べます!')
				.addUserOption(option => (
					option
						.setName("target")
						.setDescription("ユーザーを指定します。")
						.setRequired(true)
				))
		)
		.addSubcommand(subcommand =>
            subcommand
                .setName('server')
				.setDescription('サーバーの情報を調べます!')
		),
		execute: async function (interaction) {
			const subcommand = interaction.options.getSubcommand();
			if (subcommand === 'user') {
				const user = interaction.options.getUser('target')
				const member = await interaction.guild.members.fetch(user.id)
				const username = user.username
				const userid = user.id
				const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`; //*ChatGPT MOMENT
				const joinDate = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
				const roles = member.roles.cache
					.filter(role => role.id !== interaction.guild.roles.everyone.id)
					.map(role => role.name)
					.join(', ');
				
				const roleCount = member.roles.cache
					.filter(role => role.id !== interaction.guild.roles.everyone.id)
					.size; //*ChatGPT again
				await interaction.reply({
					embeds: [{
						title: `${username}の情報`,
						color: 0x77e4a6,
						fields: [{
							name: "ユーザーID",
							value: userid
						}, {
							name: "アカウント作成日",
							value: createdAt,
							inline: true
						}, {
							name: "サーバー参加日",
							value: joinDate,
							inline: true
						}, {
							name: `ロール(${RoleSelectMenuComponent})`,
							value: roles
						}]
					}]
				})

			}
			if (subcommand === 'server') {
				const guild = interaction.guild;
				const guildname = guild.name
				const gmembers = guild.memberCount;
				const gchannels = guild.channels.cache.size;
				const gvoicechannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size;
				const groles = guild.roles.cache.size;
				const boostStatus = guild.premiumSubscriptionCount > 0 ? `あり(${guild.premiumSubscriptionCount} ブースト）` : 'なし';
				const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
				console.log(`${guild.createdAt} - ${createdAt}`)

				/*
				const serverInfoMessage = `サーバーの情報\n
					人数: ${gmembers}\n
					テキストチャンネル数: ${gchannels}\n
					ボイスチャンネル数: ${gvoicechannels}\n
					ロール数: ${groles}\n
					作成日: ${createdAt}\n
					ブースト状態: ${boostStatus}`;
				*/

				await interaction.reply({
					embeds: [{
						title: `${guildname}の情報`,
						color: 0x52c9e0,
						fields: [{
							name: "サーバー人数",
							value: gmembers,
							inline: true
						}, {
							name: "サーバー作成日",
							value: createdAt,
							inline: true
						}, {
							name: "チャンネル数",
							value: `テキストチャンネル: ${gchannels}\n` + `ボイスチャンネル: ${gvoicechannels}`
						}, {
							name: "ロール数",
							value: groles
						}, {
							name: "ブーストの有無",
							value: boostStatus
						}]
					}]
				})
			}
		}
};