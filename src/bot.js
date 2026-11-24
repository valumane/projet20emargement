import { Client, Events, GatewayIntentBits } from 'discord.js';

//connexion au serv
const client = new Client({ intents: [GatewayIntentBits.Guilds] });


client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

//declenché quand une cmd est
client.on(Events.InteractionCreate, async interaction => {
  const ageReception = Date.now() - interaction.createdTimestamp;
  const debutReponse = performance.now();
  try {
      // on traite seulement les cmd comme /abc-all-presences.
    if (!interaction.isChatInputCommand()) return;

    // Commande qui consulte le CSV en passant par le serveur Express.
    if (interaction.commandName === 'abc-all-presences') {
      // Prévenir Discord que la réponse arrive, le temps de contacter l'API.
      await interaction.deferReply();

      const response = await fetch('http://127.0.0.1:3000/api/presences');
      const presences = await response.json();

      // map transforme chaque présence en texte ; join les sépare par un retour à la ligne.
      const texte = presences.map(presence =>
        `${presence.date} | ${presence.discordId} | ${presence.demiJournee} | ${presence.statut}`
      ).join('\n');

      // Remplacer la réponse en attente. Discord accepte au maximum 2 000 caractères.
      // Si le tableau est vide, afficher le message après ||.
      await interaction.editReply(texte.slice(0, 2000) || 'Aucune présence enregistrée.');

      return;
    }

    // Consulter mes émargements à la date donnée.
    if (interaction.commandName === 'abc-my-presence') {
      await interaction.deferReply();

      const date = interaction.options.getString('date', true);
      const discordId = interaction.user.id;
      const response = await fetch('http://127.0.0.1:3000/api/presences');
      const presences = await response.json();

      // Ne conserver que mes lignes pour cette date.
      const mesPresences = presences.filter(presence =>
        presence.discordId === discordId && presence.date === date
      );
      const texte = mesPresences.map(presence =>
        `${presence.demiJournee} : ${presence.statut}`
      ).join('\n');

      await interaction.editReply(
        texte.slice(0, 2000) || 'Aucun émargement enregistré pour cette date.'
      );
      return;
    }


    if(interaction.commandName==='emargement'){
      
    }


    // Envoyer mon émargement à Express pour l'enregistrer dans le CSV.
    if (interaction.commandName === 'abc-emarger') {
      await interaction.deferReply();
      const presence = {
        discordId: interaction.user.id,
        date: interaction.options.getString('date', true),
        demiJournee: interaction.options.getString('demi-journee', true),
        statut: interaction.options.getString('statut', true),
        motif: interaction.options.getString('motif') || '',
      };

      const response = await fetch('http://127.0.0.1:3000/api/presences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presence),
      });
      const resultat = await response.json();
      if (!response.ok) {
        await interaction.editReply(resultat.error);
        return;
      }

      await interaction.editReply(
        `Émargement enregistré : ${resultat.date}, ${resultat.demiJournee}, ${resultat.statut}.`
      );
      return;
    }

    // Commande d'exemple : répondre avec l'animal choisi dans Discord.
    if (interaction.commandName === 'blep') {
      // true indique que le paramètre animal est obligatoire.
      const animal = interaction.options.getString('animal', true);
      await interaction.reply(`Tu as choisi : ${animal}`);
      console.log(interaction.user.displayName + " a choisis : " + animal);//username pour le nom displayName pour pseudo
    }
  } catch (error) {
    if (error.code === 10062) {
      console.error(`/${interaction.commandName} : interaction expirée. Âge à réception : ${ageReception} ms ; temps écoulé : ${Math.round(performance.now() - debutReponse)} ms.`);
      return;
    }
    console.error(`Erreur /${interaction.commandName} :`, error.code ?? error.message);
    if (interaction.deferred) {
      await interaction.editReply('Impossible de traiter la commande. Vérifie le terminal et le serveur Express.')
        .catch(() => {});
    }
  }

});

// Connecter le bot avec le token chargé depuis le fichier .env.
client.login(process.env.DISCORD_TOKEN);

// Charger .env dans process.env. Cet import statique est exécuté avant le reste du module,
// même s'il est écrit en bas du fichier.
import 'dotenv/config';
