import 'dotenv/config';
import { commands } from './commands.js';

for (const name of ['APP_ID', 'GUILD_ID', 'DISCORD_TOKEN']) {
  if (!process.env[name]) throw new Error(`${name} est obligatoire.`);
}
const url = `https://discord.com/api/v10/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;
// POST crée ou actualise chaque commande sans supprimer les autres commandes du serveur.
for (const command of commands) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    console.error('Erreur Discord :', await response.json());
    process.exitCode = 1;
    break;
  }
  console.log(`Commande /${command.name} enregistrée !`);
}
