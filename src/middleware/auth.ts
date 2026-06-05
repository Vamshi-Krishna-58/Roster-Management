import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Role } from "../domain/auth";
import { AppError } from "../errors/AppError";

function parseBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AppError("Authorization header is required", 401);
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization format", 401);
  }

  return token;
}

interface TokenPayload extends JwtPayload {
  sub?: string;
  username?: string;
  role?: Role;
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "scheduler" || value === "viewer";
}

export function authenticateJwt(secret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const token = parseBearerToken(req.header("authorization"));
      const payload = jwt.verify(token, secret) as TokenPayload;

      if (!payload.sub || !payload.username || !isRole(payload.role)) {
        throw new AppError("Invalid token payload", 401);
      }

      req.authUser = {
        userId: payload.sub,
        username: payload.username,
        role: payload.role
      };

      next();
    } catch {
      next(new AppError("Invalid or expired token", 401));
    }
  };
}

export function requireAdmin(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser || req.authUser.role !== "admin") {
        throw new AppError("Forbidden", 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeRoles(...allowedRoles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new AppError("Unauthorized", 401));
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      next(new AppError("Forbidden", 403));
      return;
    }

    next();
  };
}
