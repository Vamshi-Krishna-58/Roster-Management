import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { RosterService } from "../services/rosterService";

interface CreateEmployeeBody {
  firstName?: string;
  lastName?: string;
  location?: string;
  department?: string;
  releaseTrain?: string;
  startDate?: string;
  endDate?: string | null;
  coxManager?: string;
  billingType?: "billable" | "non-billable";
  status?: "active" | "rolled-off";
  email?: string;
  team?: string;
  teamLead?: string;
  billRateUsd?: string;
  workLocation?: "onshore" | "offshore";
  skills?: string;
}

interface UpdateEmployeeBody extends CreateEmployeeBody {}

export class RosterController {
  public constructor(private readonly rosterService: RosterService) {}

  public async list(_req: Request, res: Response): Promise<void> {
    const items = await this.rosterService.listEmployees();
    res.status(200).json({ items });
  }

  public async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateEmployeeBody;
    const requiredFields: Array<[unknown, string]> = [
      [body.firstName, "First name"],
      [body.lastName, "Last name"],
      [body.location, "Location"],
      [body.department, "Department"],
      [body.releaseTrain, "Release train"],
      [body.startDate, "Start date"],
      [body.coxManager, "Cox manager"],
      [body.billingType, "Billing type"],
      [body.status, "Status"],
      [body.email, "Email"],
      [body.team, "Team"],
      [body.teamLead, "Team lead"],
      [body.billRateUsd, "Bill rate in $"],
      [body.workLocation, "Work location"],
      [body.skills, "Skills"]
    ];

    for (const [value, label] of requiredFields) {
      if (!value) {
        throw new AppError(`${label} is required`, 400);
      }
    }

    const item = await this.rosterService.createEmployee({
      firstName: body.firstName as string,
      lastName: body.lastName as string,
      location: body.location as string,
      department: body.department as string,
      releaseTrain: body.releaseTrain as string,
      startDate: body.startDate as string,
      endDate: body.endDate ?? null,
      coxManager: body.coxManager as string,
      billingType: body.billingType as "billable" | "non-billable",
      status: body.status as "active" | "rolled-off",
      email: body.email as string,
      team: body.team as string,
      teamLead: body.teamLead as string,
      billRateUsd: body.billRateUsd as string,
      workLocation: body.workLocation as "onshore" | "offshore",
      skills: body.skills as string
    });

    res.status(201).json({ item });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId;
    if (!employeeId || Array.isArray(employeeId)) {
      throw new AppError("Employee ID is required", 400);
    }

    const body = req.body as UpdateEmployeeBody;
    const item = await this.rosterService.updateEmployee(employeeId, {
      firstName: body.firstName,
      lastName: body.lastName,
      location: body.location,
      department: body.department,
      releaseTrain: body.releaseTrain,
      startDate: body.startDate,
      endDate: body.endDate,
      coxManager: body.coxManager,
      billingType: body.billingType,
      status: body.status,
      email: body.email,
      team: body.team,
      teamLead: body.teamLead,
      billRateUsd: body.billRateUsd,
      workLocation: body.workLocation,
      skills: body.skills
    });

    res.status(200).json({ item });
  }
}
