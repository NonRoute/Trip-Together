import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from 'hono';

const db = drizzle(process.env.DATABASE_URL!);

const app = new Hono()
app.get('/', (c) => c.text('Hello Bun!'))

export default { 
    port: 8000, 
    fetch: app.fetch, 
  } 