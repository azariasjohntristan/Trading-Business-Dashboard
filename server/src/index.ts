import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import importRouter from './routes/import';
import dashboardRouter from './routes/dashboard';
import tradesRouter from './routes/trades';
import analyticsRouter from './routes/analytics';

const app = express();
export const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/import', importRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/analytics', analyticsRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3001;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
