import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema/index.js';

export const pool = new pg.Pool();
export const db = drizzle(pool, { schema });