import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import { runMigrations} from './database/migrate';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/health', healthRouter);

async function startServer() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

startServer();