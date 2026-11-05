import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'blep') {
    const animal = interaction.options.getString('animal', true);

    await interaction.reply(`Tu as choisi : ${animal}`);
  }
});

client.login(process.env.DISCORD_TOKEN);

import 'dotenv/config';
