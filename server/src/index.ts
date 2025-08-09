import "dotenv/config";
import { cors } from "hono/cors";
import { autoMigrate } from "./lib/migrate";
import { createOpenAPIApp } from "./lib/openapi";
import { loggerMiddleware } from "./middleware/logger";
import authRouter from "./routes/auth/auth.index";
import tripsRouter from "./routes/trips/trips.index";

// Configuration
const PORT = Number(process.env.PORT) || 8000;

// Create main application instance
const app = createOpenAPIApp();

// Add CORS middleware for frontend communication
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Add logging middleware
app.use("*", loggerMiddleware);

app.get("/", (c) => c.text("Trip Together API - Running!"));

const setupRoutes = () => {
  app.route("/auth", authRouter);
  app.route("/trip", tripsRouter);
};

// Initialize server with auto-migration
const initializeServer = async () => {
  try {
    // Run auto-migration before starting the server
    await autoMigrate();

    // Setup routes after successful migration
    setupRoutes();

    // Log server startup
    console.log(`🚀 Server starting on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`🔗 OpenAPI Spec: http://localhost:${PORT}/openapi`);
  } catch (error) {
    console.error("❌ Failed to initialize server:", error);
    process.exit(1);
  }
};

// Initialize the server
initializeServer();

export default {
  port: PORT,
  fetch: app.fetch,
};

// Export the app type for RPC
export type AppType = typeof app;
