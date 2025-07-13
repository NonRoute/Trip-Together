import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Create a separate pool for migrations
const migrationPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrationDb = drizzle(migrationPool);

// Auto-migration function
export async function autoMigrate(): Promise<void> {
  console.log("🔍 Checking database migrations...");

  try {
    // Use Drizzle's built-in migrate function
    // This will automatically handle:
    // - Creating the migrations table if it doesn't exist
    // - Tracking which migrations have been applied
    // - Applying only pending migrations
    console.log("🚀 Applying migrations...");
    await migrate(migrationDb, { migrationsFolder: "./drizzle" });

    console.log("✅ Database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await migrationPool.end();
  }
}
