import express from 'express';
import { readFile } from 'node:fs/promises';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

const app = express();
app.use(express.json());
const fichier = new URL('../data/presences.csv', import.meta.url);


app.get('/api/presences', async (req, res) => {
  try {
    const contenu = await readFile(fichier, 'utf8');
    const presences = parse(contenu, {
      columns: true,
      skip_empty_lines: true,
    });

    res.json(presences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de lire le fichier.' });
  }
});


// Enregistrer un émargement. Les opérations synchrones évitent deux écritures simultanées.
app.post('/api/presences', (req, res) => {
  try {
    const { discordId, date, demiJournee, statut, motif = '' } = req.body;
    if (statut === 'absent' && !motif.trim()) {
      return res.status(400).json({ error: 'Un motif est nécessaire pour une absence.' });
    }

    const presences = parse(readFileSync(fichier, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    });
    const presence = { discordId, date, demiJournee, statut, motif };

    // Une seule ligne par étudiant, date et demi-journée : remplacer si elle existe.
    const index = presences.findIndex(ligne =>
      ligne.discordId === discordId && ligne.date === date && ligne.demiJournee === demiJournee
    );
    if (index === -1) presences.push(presence);
    else presences[index] = presence;

    // La bibliothèque protège les motifs contenant des virgules ou retours à la ligne.
    const contenu = stringify(presences, {
      header: true,
      columns: ['discordId', 'date', 'demiJournee', 'statut', 'motif'],
    });
    const temporaire = new URL('../data/presences.csv.tmp', import.meta.url);
    writeFileSync(temporaire, contenu);
    renameSync(temporaire, fichier);
    res.status(index === -1 ? 201 : 200).json(presence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible d’enregistrer l’émargement.' });
  }
});


app.listen(3000, '127.0.0.1', () => {
  console.log('Serveur sur http://127.0.0.1:3000');
});
