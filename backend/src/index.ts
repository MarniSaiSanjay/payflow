import express from 'express';
import { env } from './env';
import { errorHandler } from './middleware/error';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`PayFlow Tracker API listening on http://localhost:${env.PORT}`);
});
