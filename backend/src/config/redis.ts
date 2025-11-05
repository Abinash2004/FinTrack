import Redis from "ioredis";
import dotenv from 'dotenv'

dotenv.config({quiet:true});

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

export default redis;
