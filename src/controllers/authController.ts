import type { Request, Response } from "express";
import type { Role } from "../domain/auth";
import { AppError } from "../errors/AppError";
import { AuthService } from "../services/authService";

interface LoginRequestBody {
  username?: string;
  password?: string;
}

interface CreateUserRequestBody {
  username?: string;
  password?: string;
  role?: string;
}

function isValidRole(value: unknown): value is Role {
  return value === "admin" || value === "scheduler" || value === "viewer";
}

export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  public login(req: Request, res: Response): void {
    const body = req.body as LoginRequestBody;
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      throw new AppError("Username and password are required", 400);
    }

    const token = this.authService.login(username, password);
    res.status(200).json({
      accessToken: token.accessToken,
      tokenType: "Bearer",
      expiresIn: token.expiresIn,
      user: {
        id: token.user.userId,
        username: token.user.username,
        role: token.user.role
      }
    });
  }

  public createUser(req: Request, res: Response): void {
    const body = req.body as CreateUserRequestBody;
    const username = body.username?.trim();
    const password = body.password;
    const role = body.role?.trim();

    if (!username || !password || !role) {
      throw new AppError("Username, password, and role are required", 400);
    }

    if (!isValidRole(role)) {
      throw new AppError("Role must be admin, scheduler, or viewer", 400);
    }

    const user = this.authService.createUser({
      username,
      password,
      role
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  }

  public listUsers(req: Request, res: Response): void {
    const users = this.authService.listUsers();
    res.status(200).json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role
      }))
    });
  }
}
