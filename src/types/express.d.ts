import type { AuthenticatedUser } from "../domain/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export {};
