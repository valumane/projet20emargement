import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = join(projectDirectory, 'public');
const defaultCsvFile = join(projectDirectory, 'data', 'presences.csv');

// Un seul serveur pour le site et l'API du bot.
export function createServer({ csvFile = defaultCsvFile } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Le bot récupère les lignes du CSV sous forme de JSON.
  app.get('/api/presences', async (req, res) => {
    try {
      const contenu = await readFile(csvFile, 'utf8');
      const presences = parse(contenu, {
        columns: true,
        skip_empty_lines: true,
      });
      res.set('Cache-Control', 'no-store');
      res.json(presences);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Impossible de lire le fichier.' });
    }
  });

  // Le bot enregistre l'émargement dans le même CSV que celui utilisé par le site.
  app.post('/api/presences', (req, res) => {
    try {
      const { discordId, date, demiJournee, statut, motif = '' } = req.body;
      if (statut === 'absent' && !motif.trim()) {
        return res.status(400).json({ error: 'Un motif est nécessaire pour une absence.' });
      }

      const presences = parse(readFileSync(csvFile, 'utf8'), {
        columns: true,
        skip_empty_lines: true,
      });
      const presence = { discordId, date, demiJournee, statut, motif };

      // Remplacer la ligne si cet étudiant a déjà émargé pour cette demi-journée.
      const index = presences.findIndex(ligne =>
        ligne.discordId === discordId && ligne.date === date && ligne.demiJournee === demiJournee
      );
      if (index === -1) presences.push(presence);
      else presences[index] = presence;

      const contenu = stringify(presences, {
        header: true,
        columns: ['discordId', 'date', 'demiJournee', 'statut', 'motif'],
      });
      const temporaire = `${csvFile}.tmp`;
      writeFileSync(temporaire, contenu);
      renameSync(temporaire, csvFile);
      res.status(index === -1 ? 201 : 200).json(presence);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Impossible d’enregistrer l’émargement.' });
    }
  });

  // Le site de ton binôme charge le fichier CSV directement à cette adresse.
  app.get('/data/presences.csv', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(resolve(csvFile));
  });

  // Servir index.html, site.js, csv.js et les autres fichiers du site.
  app.use(express.static(publicDirectory));

  return createHttpServer(app);
}

// Ne pas démarrer automatiquement lorsque le module est importé dans un test.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  createServer().listen(port, host, () => {
    console.log(`Site et API prêts sur http://${host}:${port}`);
  });
}
