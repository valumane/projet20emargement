import express from 'express';
import { timingSafeEqual } from 'node:crypto';

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
const validId = value => typeof value === 'string' && /^\d{1,20}$/.test(value);

export function createApp({ token, store }) {
  if (!token) throw new Error('BOT_API_TOKEN est obligatoire.');
  const app = express();
  app.use('/api', (req, res, next) => {
    const actual = Buffer.from(req.get('authorization') ?? '');
    const expected = Buffer.from(`Bearer ${token}`);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return res.status(401).json({ error: 'Accès refusé.' });
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/presences', async (req, res) => {
    const { discordId, date } = req.query;
    if (!validId(discordId) || (date !== undefined && !validDate(date))) {
      return res.status(400).json({ error: 'discordId obligatoire et date au format AAAA-MM-JJ.' });
    }
    res.json(await store.list({ discordId, ...(date === undefined ? {} : { date }) }));
  });
  app.post('/api/presences', async (req, res) => {
    const { discordId, date, demiJournee, statut, motif = '' } = req.body ?? {};
    if (!validDate(date)) return res.status(400).json({ error: 'Date invalide. Utilise le format AAAA-MM-JJ, par exemple 2026-11-17.' });
    if (statut === 'absent' && (typeof motif !== 'string' || !motif.trim())) {
      return res.status(400).json({ error: 'Un motif est obligatoire pour déclarer une absence.' });
    }
    if (!validId(discordId) || !['matin', 'apres-midi'].includes(demiJournee)
      || !['present', 'absent'].includes(statut) || typeof motif !== 'string' || motif.length > 1000
      || (statut === 'absent' && !motif.trim())) {
      return res.status(400).json({ error: 'Présence invalide : identifiant, date, demi-journée, statut et motif si absence requis.' });
    }
    const result = await store.save({ discordId, date, demiJournee, statut, motif: statut === 'present' ? '' : motif.trim() });
    res.status(result.created ? 201 : 200).json(result.presence);
  });
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide.' });
    if (error.status === 413) return res.status(413).json({ error: 'Requête trop volumineuse.' });
    console.error(error);
    res.status(500).json({ error: 'Impossible d’accéder aux présences.' });
  });
  return app;
}
