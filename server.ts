import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BinanceTechnicalEngine, TIMEFRAMES, type Timeframe } from './server/taEngine';

const app = express();
const engine = new BinanceTechnicalEngine();
const port = Number(process.env.PORT || process.env.TA_SERVER_PORT || 3002);
const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

app.disable('x-powered-by');
app.get('/api/ta', (req, res) => {
  const timeframe = String(req.query.timeframe || '');
  if (!TIMEFRAMES.includes(timeframe as Timeframe)) {
    res.status(400).json({ error: 'Invalid timeframe', validTimeframes: TIMEFRAMES });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json(engine.getTimeframe(timeframe as Timeframe));
});

app.get('/api/health', (_req, res) => {
  res.json({ service: 'binance-technical-analysis', timeframes: TIMEFRAMES });
});

if (existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const server = app.listen(port, '0.0.0.0', () => {
  console.info(`[TA] Express API listening on http://localhost:${port}`);
  void engine.start();
});

const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
