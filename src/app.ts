import express, {
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import dotenv from "dotenv";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// Environment Configuration
// ─────────────────────────────────────────────────────────────────────────

type Environment = "development" | "production";

const environment: Environment =
  process.env.NODE_ENV === "production" ? "production" : "development";

const envFile =
  environment === "production" ? "production.env" : "development.env";

const envPath = path.resolve(process.cwd(), "env", envFile);

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.warn(`Warning: Unable to load environment file: ${envPath}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Initialize Express
// ─────────────────────────────────────────────────────────────────────────

const app = express();

app.disable("x-powered-by");

// EJS configuration
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), "src", "views"));

// ─────────────────────────────────────────────────────────────────────────
// Static Files — public folder
// ─────────────────────────────────────────────────────────────────────────

app.use(express.static(path.resolve(process.cwd(), "public")));

// ─────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────
// Home Page — EJS
// ─────────────────────────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response): void => {
  res.status(200).render("index", {
    title: "Xero Integration App",
    message: "Welcome to the Xero Integration App",
    environment,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Health Check API
// ─────────────────────────────────────────────────────────────────────────

interface HealthResponse {
  success: boolean;
  message: string;
  environment: Environment;
  timestamp: string;
}

app.get("/health", (_req: Request, res: Response<HealthResponse>): void => {
  res.status(200).json({
    success: true,
    message: "Xero Integration API is running",
    environment,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 404 — Route Not Found
// ─────────────────────────────────────────────────────────────────────────

app.use((req: Request, res: Response): void => {
  res.status(404).render("error", {
    title: "404 - Page Not Found",
    statusCode: 404,
    message: `The route "${req.originalUrl}" was not found.`,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────────────────

const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("[Application Error]", err);

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).render("error", {
    title: "500 - Internal Server Error",
    statusCode: 500,
    message: "An unexpected error occurred.",
  });
};

app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Xero Integration App running at http://localhost:${PORT}`);
  console.log(`Environment: ${environment}`);
});
