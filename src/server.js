import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const publicDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const projectDirectory = join(publicDirectory, '..');
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/site.js', ['site.js', 'text/javascript; charset=utf-8']],
  ['/csv.js', ['csv.js', 'text/javascript; charset=utf-8']],
]);
const defaultCsvFile = join(projectDirectory, 'data', 'presences.csv');

export function createServer({ csvFile = defaultCsvFile } = {}) {
  return createHttpServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Méthode non autorisée.');
      return;
    }

    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = pathname === '/data/presences.csv'
      ? [csvFile, 'text/csv; charset=utf-8']
      : files.get(pathname);
    if (!file) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Page introuvable.');
      return;
    }

    try {
      const filePath = pathname === '/data/presences.csv'
        ? csvFile
        : join(publicDirectory, file[0]);
      const content = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': file[1],
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(pathname === '/data/presences.csv' ? 'Fichier CSV introuvable.' : 'Page introuvable.');
        return;
      }
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Impossible de charger le site.');
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || 'localhost';
  createServer().listen(port, host, () => {
    console.log(`Site prêt sur http://${host}:${port}`);
  });
}
