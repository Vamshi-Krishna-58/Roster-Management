import { Router } from "express";
import { authorizeRoles } from "../middleware/auth";
import { ForecastController } from "../controllers/forecastController";

export function createForecastRoutes(forecastController: ForecastController): Router {
  const router = Router();

  router.get("/api/v1/forecasts", authorizeRoles("admin", "scheduler", "viewer"), (req, res, next) => {
    forecastController.getMyForecasts(req, res).catch(next);
  });

  router.put("/api/v1/forecasts", authorizeRoles("admin", "scheduler", "viewer"), (req, res, next) => {
    forecastController.saveMyForecasts(req, res).catch(next);
  });

  router.get("/api/v1/forecasts/all", authorizeRoles("admin", "scheduler"), (req, res, next) => {
    forecastController.getAllForecasts(req, res).catch(next);
  });

  router.get("/api/v1/forecasts/:employeeId", authorizeRoles("admin", "scheduler"), (req, res, next) => {
    forecastController.getEmployeeForecasts(req, res).catch(next);
  });

  return router;
}
