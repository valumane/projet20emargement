import 'dotenv/config';
import { commands } from './commands.js';

for (const name of ['APP_ID', 'GUILD_ID', 'DISCORD_TOKEN']) {
  if (!process.env[name]) throw new Error(`${name} est obligatoire.`);
}
const url = `https://discord.com/api/v10/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;

// Chaque objet décrit une commande à enregistrer sur le serveur Discord.
const commands = [
  {
    name: 'abc-emarger',
    type: 1,
    description: 'Enregistrer ma présence ou mon absence',
    options: [
      { name: 'date', description: 'Date au format AAAA-MM-JJ', type: 3, required: true },
      {
        name: 'demi-journee', description: 'Demi-journée concernée', type: 3, required: true,
        choices: [{ name: 'Matin', value: 'matin' }, { name: 'Après-midi', value: 'apres-midi' }],
      },
      {
        name: 'statut', description: 'Présent ou absent', type: 3, required: true,
        choices: [{ name: 'Présent', value: 'present' }, { name: 'Absent', value: 'absent' }],
      },
      { name: 'motif', description: 'Motif obligatoire pour une absence', type: 3, max_length: 1000 },
    ],
  },
  {
    name: 'abc-all-presences',
    type: 1,
    description: 'Afficher les présences du tableur',
  },
  {
    name: 'abc-my-presence',
    type: 1,
    description: 'Consulter ma présence à une date',
    options: [
      {
        name: 'date',
        description: 'Date au format AAAA-MM-JJ',
        type: 3, // Paramètre texte
        required: true,
      },
    ],
  },
  {
    name: 'emargement',
    description: 'Date au format AAAA-MM-JJ',
    type: 3,
    required: true
  }
];

// POST ajoute ou met à jour chaque commande sans supprimer les autres.
for (const command of commands) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (response.ok) {
    console.log(`Commande /${command.name} enregistrée !`);
  } else {
    console.error('Erreur Discord :', await response.json());
    process.exitCode = 1;
  }
}
