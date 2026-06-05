export type Role = "admin" | "scheduler" | "viewer";

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  role: Role;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: Role;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: Role;
}
