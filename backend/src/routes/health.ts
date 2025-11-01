import express from 'express';
import { checkDatabaseConnectivity } from '../controller/connection';

const router = express.Router();

router.get('/isConnected',checkDatabaseConnectivity);

export default router;