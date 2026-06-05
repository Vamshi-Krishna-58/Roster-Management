import { randomUUID } from "crypto";
import type { CreateUserInput, UserRecord } from "../domain/auth";
import { AppError } from "../errors/AppError";

export class UserRepository {
  private readonly users: UserRecord[] = [
    { id: "u-1", username: "admin", password: "admin123", role: "admin" },
    { id: "u-2", username: "scheduler", password: "scheduler123", role: "scheduler" },
    { id: "u-3", username: "viewer", password: "viewer123", role: "viewer" }
  ];

  public findByUsername(username: string): UserRecord | undefined {
    return this.users.find((user) => user.username === username);
  }

  public createUser(input: CreateUserInput): UserRecord {
    const normalizedUsername = input.username.trim().toLowerCase();
    if (!normalizedUsername || normalizedUsername.length < 3) {
      throw new AppError("Username must be at least 3 characters", 400);
    }

    if (this.findByUsername(normalizedUsername)) {
      throw new AppError("Username already exists", 409);
    }

    const normalizedPassword = input.password;
    if (!normalizedPassword || normalizedPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const user: UserRecord = {
      id: randomUUID(),
      username: normalizedUsername,
      password: normalizedPassword,
      role: input.role
    };

    this.users.push(user);
    return user;
  }

  public listUsers(): UserRecord[] {
    return this.users.map((user) => ({
      id: user.id,
      username: user.username,
      password: "",
      role: user.role
    }));
  }
}
