import type { Request, Response } from "express";
import type { SaveForecastInput } from "../domain/forecast";
import { AppError } from "../errors/AppError";
import { ForecastService } from "../services/forecastService";

interface SaveForecastBody {
  entries?: Array<{
    forecastMonth?: string;
    hoursAdjustment?: number;
  }>;
}

export class ForecastController {
  public constructor(private readonly forecastService: ForecastService) {}

  public async getMyForecasts(req: Request, res: Response): Promise<void> {
    const employeeId = req.authUser?.userId;
    if (!employeeId) {
      throw new AppError("Unauthorized", 401);
    }

    const items = await this.forecastService.getForecasts(employeeId);
    res.status(200).json({ items });
  }

  public async getEmployeeForecasts(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId;
    if (!employeeId || Array.isArray(employeeId)) {
      throw new AppError("Employee ID is required", 400);
    }

    const items = await this.forecastService.getForecasts(employeeId);
    res.status(200).json({ items });
  }

  public async getAllForecasts(_req: Request, res: Response): Promise<void> {
    const items = await this.forecastService.getAllForecasts();
    res.status(200).json({ items });
  }

  public async saveMyForecasts(req: Request, res: Response): Promise<void> {
    const employeeId = req.authUser?.userId;
    if (!employeeId) {
      throw new AppError("Unauthorized", 401);
    }

    const body = req.body as SaveForecastBody;
    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      throw new AppError("At least one forecast entry is required", 400);
    }

    const inputs: SaveForecastInput[] = body.entries.map((entry) => {
      if (!entry.forecastMonth) {
        throw new AppError("Forecast month is required for each entry", 400);
      }
      if (entry.hoursAdjustment === undefined || entry.hoursAdjustment === null) {
        throw new AppError("Hours adjustment is required for each entry", 400);
      }
      return {
        forecastMonth: entry.forecastMonth,
        hoursAdjustment: Number(entry.hoursAdjustment)
      };
    });

    const items = await this.forecastService.saveForecasts(employeeId, inputs);
    res.status(200).json({ items, message: "Forecast saved successfully" });
  }
}
