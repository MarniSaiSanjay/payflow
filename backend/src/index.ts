import express from 'express';
import cors from 'cors';
import { env } from './env';
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middleware/error';

const app = express();

// Allow the frontend dev origin to call the API. Tighten / read from env for prod.
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/payments', paymentRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`PayFlow Tracker API listening on http://localhost:${env.PORT}`);
});
