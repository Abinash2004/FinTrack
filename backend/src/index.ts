import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/health', healthRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
