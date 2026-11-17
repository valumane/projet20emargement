import 'dotenv/config';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { createStore } from './store.js';

const app = createApp({
  token: process.env.BOT_API_TOKEN,
  store: createStore(resolve(process.env.CSV_PATH || 'data/presences.csv')),
});
const port = process.env.PORT || 3000;
app.listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log(`API prête sur http://${process.env.HOST || '127.0.0.1'}:${port}`);
});
