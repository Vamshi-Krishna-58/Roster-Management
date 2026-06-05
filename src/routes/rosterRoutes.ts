import { Router } from "express";
import { authorizeRoles } from "../middleware/auth";
import { RosterController } from "../controllers/rosterController";

export function createRosterRoutes(rosterController: RosterController): Router {
  const router = Router();

  router.get("/api/v1/employees", authorizeRoles("admin", "scheduler", "viewer"), (req, res, next) => {
    rosterController.list(req, res).catch(next);
  });

  router.post("/api/v1/employees", authorizeRoles("admin", "scheduler"), (req, res, next) => {
    rosterController.create(req, res).catch(next);
  });

  router.patch("/api/v1/employees/:employeeId", authorizeRoles("admin", "scheduler"), (req, res, next) => {
    rosterController.update(req, res).catch(next);
  });

  return router;
}
