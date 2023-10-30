const { SlashCommandBuilder } = require('discord.js');
const axios = require("axios").default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ipinfo')
        .setDescription('IPInfo Lookup')
        .addStringOption(option =>
            option
                .setName("ip")
                .setDescription("IPアドレスを指定します。")
				.setRequired(true)
        ),
    execute: async function (interaction) {
        await interaction.deferReply();
        let ip = interaction.options.getString("ip");
        try {
            let data = (await axios.get(`https://ipinfo.io/${encodeURI(ip)}/json`)).data;
			console.log(`Target: ${encodeURI(ip)}`)
			console.log(`Status: ${data.status}`)
            if (data?.status == "404" || data?.bogon == true) {
                throw new Error("IPアドレスが間違っています");
            }
			console.log(data.hostname)
			console.log(data.country)
			console.log(data.city)
			console.log(data.region)
			console.log(data.org)
            await interaction.editReply({
                embeds: [{
                    title: `${ip}'s IPInfo`,
                    color: 0xfd75ff,
                    footer: {
                        text: "ringoXD's Discord.js Bot"
                    },
                    fields: [{
						name: "Target",
						value: interaction.options.getString("ip")
					}, {
                        name: "Country",
                        value: data.country
                    }, {
                        name: "City",
                        value: data.city
                    }, {
                        name: "Region",
                        value: data.region
                    }, {
                        name: "org",
                        value: data.org
                    }]
                }],
            })
        } catch (e) {
            await interaction.editReply({
                embeds: [{
                    title: "エラー",
                    description: `${e.message}`,
                    color: 0xff0000,
                    footer: {
                        text: "ringoXD's Discord.js Bot"
                    }
                }]
            })
        }
    }
};