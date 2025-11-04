import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { runMigrations} from './database/migrate';
import cookieParser from 'cookie-parser';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/auth', authRouter);

async function startServer() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

startServer();