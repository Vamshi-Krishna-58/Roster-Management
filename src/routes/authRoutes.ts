import { Router } from "express";
import { AuthController } from "../controllers/authController";

export function createAuthRoutes(authController: AuthController, authMiddleware: (req: any, res: any, next: any) => void, adminMiddleware: (req: any, res: any, next: any) => void): Router {
  const router = Router();

  router.post("/api/v1/auth/login", (req, res, next) => {
    try {
      authController.login(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/v1/users", authMiddleware, adminMiddleware, (req, res, next) => {
    try {
      authController.createUser(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/v1/users", authMiddleware, adminMiddleware, (req, res, next) => {
    try {
      authController.listUsers(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
