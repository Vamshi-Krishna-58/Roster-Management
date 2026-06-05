import type { Request, Response } from "express";

export class HealthController {
  public constructor(private readonly appName: string) {}

  public getHealth(_req: Request, res: Response): void {
    res.status(200).json({ status: "ok", service: this.appName });
  }
}
