import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';

test('API : authentification, validation, écritures concurrentes et persistance CSV', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'emargement-'));
  const file = join(dir, 'presences.csv');
  const server = createApp({ token: 'test-secret', store: createStore(file) }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' };
  const presence = { discordId: '123456789012345678', date: '2026-11-17', demiJournee: 'matin', statut: 'absent', motif: 'Médecin, consultation\njustifiée' };
  const post = body => fetch(`${base}/api/presences`, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(`${base}/api/presences?discordId=${presence.discordId}`)).status, 401);
    assert.equal((await post({ ...presence, date: '2026-02-30' })).status, 400);
    assert.equal((await post({ ...presence, motif: '' })).status, 400);
    assert.equal((await post(presence)).status, 201);
    assert.deepEqual(await createStore(file).list({ discordId: presence.discordId }), [presence]);
    const results = await Promise.all([
      post({ ...presence, statut: 'present' }),
      post({ ...presence, demiJournee: 'apres-midi' }),
    ]);
    assert.deepEqual(results.map(result => result.status), [200, 201]);
    const rows = await (await fetch(`${base}/api/presences?discordId=${presence.discordId}&date=${presence.date}`, { headers })).json();
    assert.equal(rows.length, 2);
    assert.equal(rows.find(row => row.demiJournee === 'matin').motif, '');
    assert.equal((await createStore(file).list({ discordId: '999' })).length, 0);
    assert.match(await readFile(file, 'utf8'), /discordId,date,demiJournee,statut,motif/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
