import dotenv from 'dotenv';
import express from 'express';
import authRouter from './routes/auth';
import oauthRouter from './routes/oauth';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import healthRouter from './routes/health';
import { runMigrations} from './database/migrate';


dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/auth', oauthRouter);

async function startServer() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

startServer();