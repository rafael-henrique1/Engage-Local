import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { errorHandler } from "./middlewares/error";
import logger from "./lib/logger";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/project";

const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit(config.rateLimit));

// Log de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

// Rotas
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// Middleware de erro
app.use(errorHandler);

export default app;
