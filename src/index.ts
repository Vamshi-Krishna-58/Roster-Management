import express, { type Application } from "express";
import path from "path";
import { APP_NAME, getConfig } from "./config/env";
import { AuthController } from "./controllers/authController";
import { ForecastController } from "./controllers/forecastController";
import { HealthController } from "./controllers/healthController";
import { RosterController } from "./controllers/rosterController";
import { authenticateJwt, requireAdmin } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { ForecastRepository } from "./repositories/forecastRepository";
import { RosterRepository } from "./repositories/rosterRepository";
import { UserRepository } from "./repositories/userRepository";
import { createAuthRoutes } from "./routes/authRoutes";
import { createForecastRoutes } from "./routes/forecastRoutes";
import { createHealthRoutes } from "./routes/healthRoutes";
import { createRosterRoutes } from "./routes/rosterRoutes";
import { AuthService } from "./services/authService";
import { ForecastService } from "./services/forecastService";
import { RosterService } from "./services/rosterService";

export function createApp(): Application {
  const config = getConfig();
  const app = express();
  const healthController = new HealthController(config.appName);
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository, config.jwtSecret, config.jwtExpiresIn);
  const authController = new AuthController(authService);
  const rosterRepository = new RosterRepository(config.dynamoTableName, config.awsRegion, config.dynamoEndpoint);
  const rosterService = new RosterService(rosterRepository);
  const rosterController = new RosterController(rosterService);
  const forecastRepository = new ForecastRepository(config.forecastTableName, config.awsRegion, config.dynamoEndpoint);
  const forecastService = new ForecastService(forecastRepository, rosterRepository);
  const forecastController = new ForecastController(forecastService);
  const publicDirectory = path.resolve(process.cwd(), "public");

  app.use(express.json());
  app.use(express.static(publicDirectory));
  app.use(createHealthRoutes(healthController));
  app.use(createAuthRoutes(authController, authenticateJwt(config.jwtSecret), requireAdmin()));
  app.use("/api/v1", authenticateJwt(config.jwtSecret));
  app.use(createRosterRoutes(rosterController));
  app.use(createForecastRoutes(forecastController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { APP_NAME } from "./config/env";
