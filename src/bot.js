import 'dotenv/config';
import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { trigramme } from './commands.js';

for (const name of ['DISCORD_TOKEN', 'BOT_API_TOKEN']) {
  if (!process.env[name]) throw new Error(`${name} est obligatoire.`);
}
async function api(path, body) {
  const response = await fetch(new URL(path, process.env.API_URL || 'http://127.0.0.1:3000'), {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.BOT_API_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Erreur API.');
    error.apiStatus = response.status;
    throw error;
  }
  return data;
}
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.on(Events.ClientReady, readyClient => console.log(`Logged in as ${readyClient.user.tag}!`));
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === 'blep') {
      await interaction.reply(`Tu as choisi : ${interaction.options.getString('animal', true)}`);
      return;
    }
    if (![`${trigramme}-presence`, `${trigramme}-emarger`].includes(interaction.commandName)) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const date = interaction.options.getString('date', true);
    if (interaction.commandName === `${trigramme}-presence`) {
      const query = new URLSearchParams({ discordId: interaction.user.id, date });
      const rows = await api(`/api/presences?${query}`);
      await interaction.editReply(rows.length
        ? rows.map(row => `${row.date} — ${row.demiJournee} : ${row.statut}`).join('\n')
        : 'Aucun émargement enregistré pour cette date.');
    } else {
      await api('/api/presences', {
        discordId: interaction.user.id, date,
        demiJournee: interaction.options.getString('demi-journee', true),
        statut: interaction.options.getString('statut', true),
        motif: interaction.options.getString('motif') || '',
      });
      await interaction.editReply('Émargement enregistré.');
    }
  } catch (error) {
    console.error(error);
    let content = 'Impossible de traiter la commande. Consulte le terminal du bot pour le détail.';
    if (error.apiStatus === 400) content = error.message;
    else if (error.apiStatus === 401) content = 'Accès à l’API refusé. Redémarre le bot et l’API avec le même BOT_API_TOKEN.';
    else if (error.apiStatus >= 500) content = 'L’API ne peut pas accéder au fichier des présences. Consulte le terminal de l’API.';
    else if (error.cause?.code === 'ECONNREFUSED') content = 'API inaccessible. Lance npm start dans un autre terminal.';
    else if (['TimeoutError', 'AbortError'].includes(error.name)) content = 'L’API met trop de temps à répondre.';
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply(content);
      else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (replyError) { console.error(replyError); }
  }
});
client.login(process.env.DISCORD_TOKEN);
