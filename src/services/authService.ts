import jwt from "jsonwebtoken";
import type { AuthToken, CreateUserInput } from "../domain/auth";
import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/userRepository";

export class AuthService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: number
  ) {}

  public login(username: string, password: string): AuthToken {
    const user = this.userRepository.findByUsername(username);

    if (!user || user.password !== password) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = jwt.sign({ username: user.username, role: user.role }, this.jwtSecret, {
      subject: user.id,
      expiresIn: this.jwtExpiresIn
    });

    return {
      accessToken,
      expiresIn: this.jwtExpiresIn,
      user: {
        userId: user.id,
        username: user.username,
        role: user.role
      }
    };
  }

  public createUser(input: CreateUserInput) {
    return this.userRepository.createUser(input);
  }

  public listUsers() {
    return this.userRepository.listUsers();
  }
}
