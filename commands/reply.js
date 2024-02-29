// @ts-check

const assert = require('assert');
const { SlashCommandBuilder } = require("discord.js");
const { LANG } = require("../util/languages");
const { ClientMessageHandler, ReplyPattern } = require("../internal/messages");

/** @type {import("../util/types").Command} */
const commandReply = {
    data: new SlashCommandBuilder()
        .setName(LANG.commands.reply.name)
        .setDescription(LANG.commands.reply.description)
        .addSubcommand(subcommand =>
            subcommand
                .setName(LANG.commands.reply.subcommands.add.name)
                .setDescription(LANG.commands.reply.subcommands.add.description)
                .addStringOption(option =>
                    option
                        .setName(LANG.commands.reply.subcommands.add.options.message.name)
                        .setDescription(LANG.commands.reply.subcommands.add.options.message.description)
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName(LANG.commands.reply.subcommands.add.options.reply.name)
                        .setDescription(LANG.commands.reply.subcommands.add.options.reply.description)
                        .setRequired(true))
                .addBooleanOption(option =>
                    option
                        .setName(LANG.commands.reply.subcommands.add.options.perfectMatching.name)
                        .setDescription(LANG.commands.reply.subcommands.add.options.perfectMatching.description)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(LANG.commands.reply.subcommands.remove.name)
                .setDescription(LANG.commands.reply.subcommands.remove.description)
                .addStringOption(option =>
                    option
                        .setName(LANG.commands.reply.subcommands.remove.name)
                        .setDescription(LANG.commands.reply.subcommands.remove.description)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(LANG.commands.reply.subcommands.list.name)
                .setDescription(LANG.commands.reply.subcommands.list.description)),

    async execute(interaction) {
        const guild = interaction.guild;
        if (guild == null) {
            await interaction.reply(LANG.commands.reply.notInGuildError);
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const clientMessageHandler = ClientMessageHandler.instance;
        assert(clientMessageHandler != null);

        const guildMessageHandler = clientMessageHandler.getGuildMessageHandler(guild.id);

        switch (subcommand) {
            case LANG.commands.reply.subcommands.add.name:
                const replyPattern = new ReplyPattern(
                    interaction.options.getString(LANG.commands.reply.subcommands.add.options.message.name, true),
                    interaction.options.getString(LANG.commands.reply.subcommands.add.options.reply.name, true),
                    interaction.options.getBoolean(LANG.commands.reply.subcommands.add.options.perfectMatching.name, false) ?? false
                );
                const success = await guildMessageHandler.addReplyPattern(replyPattern);
                if (success) {
                    await interaction.reply(LANG.commands.reply.subcommands.add.succeeded + '\n' + replyPattern);
                } else {
                    await interaction.reply({
                        content: LANG.commands.reply.subcommands.add.alreadyExists,
                        ephemeral: true,
                    });
                }
                return;
            case LANG.commands.reply.subcommands.remove.name:
            case LANG.commands.reply.subcommands.list.name:
            default:
                assert.fail(subcommand);
        }
    }
};

module.exports = commandReply;
