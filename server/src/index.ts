import "dotenv/config";
import { autoMigrate } from "./lib/migrate";
import { createOpenAPIApp } from "./lib/openapi";
import { loggerMiddleware } from "./middleware/logger";
import authRouter from "./routes/auth/auth.index";

// Configuration
const PORT = Number(process.env.PORT) || 8000;

// Create main application instance
const app = createOpenAPIApp();

// Add logging middleware
app.use("*", loggerMiddleware);

app.get("/", (c) => c.text("Trip Together API - Running!"));

const setupRoutes = () => {
  app.route("/auth", authRouter);
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
