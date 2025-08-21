import app from "./app";
import { env } from "./config";
import logger from "./lib/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`íº€ Server running on port ${env.PORT}`);
});

const shutdown = () => {
  logger.info("Recebido sinal de encerramento");
  server.close(() => {
    logger.info("Servidor encerrado");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});
