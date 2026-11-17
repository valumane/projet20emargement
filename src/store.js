import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const columns = ['discordId', 'date', 'demiJournee', 'statut', 'motif'];

// Une seule instance de l'API doit écrire dans ce fichier.
export function createStore(file) {
  let queue = Promise.resolve();
  async function read() {
    try {
      return parse(await readFile(file, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  return {
    async list(filters) {
      await queue;
      return (await read()).filter(row => Object.entries(filters).every(([key, value]) => row[key] === value));
    },
    save(presence) {
      const task = queue.then(async () => {
        const rows = await read();
        const index = rows.findIndex(row => row.discordId === presence.discordId && row.date === presence.date && row.demiJournee === presence.demiJournee);
        if (index === -1) rows.push(presence);
        else rows[index] = presence;
        await mkdir(dirname(file), { recursive: true });
        await writeFile(`${file}.tmp`, stringify(rows, { header: true, columns }), { mode: 0o600 });
        await rename(`${file}.tmp`, file);
        return { presence, created: index === -1 };
      });
      queue = task.catch(() => {});
      return task;
    },
  };
}
