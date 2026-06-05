import type {
  BillingType,
  CreateEmployeeInput,
  EmployeeRecord,
  EmployeeStatus,
  UpdateEmployeeInput
} from "../domain/roster";
import { AppError } from "../errors/AppError";
import { RosterRepository } from "../repositories/rosterRepository";

export class RosterService {
  public constructor(private readonly rosterRepository: RosterRepository) {}

  public async listEmployees(): Promise<EmployeeRecord[]> {
    return this.rosterRepository.listEmployees();
  }

  public async createEmployee(input: CreateEmployeeInput): Promise<EmployeeRecord> {
    const normalizedInput = this.normalizeCreateInput(input);
    this.validateDates(normalizedInput.startDate, normalizedInput.endDate);
    return this.rosterRepository.createEmployee(normalizedInput);
  }

  public async updateEmployee(employeeId: string, input: UpdateEmployeeInput): Promise<EmployeeRecord> {
    const normalizedEmployeeId = employeeId.trim();
    if (!normalizedEmployeeId) {
      throw new AppError("Employee ID is required", 400);
    }

    const normalizedInput = this.normalizeUpdateInput(input);
    if (Object.keys(normalizedInput).length === 0) {
      throw new AppError("At least one employee field must be provided for update", 400);
    }

    if (normalizedInput.startDate !== undefined || normalizedInput.endDate !== undefined) {
      const currentEmployees = await this.rosterRepository.listEmployees();
      const currentEmployee = currentEmployees.find((employee) => employee.employeeId === normalizedEmployeeId);
      if (!currentEmployee) {
        throw new AppError("Employee not found", 404);
      }

      this.validateDates(
        normalizedInput.startDate ?? currentEmployee.startDate,
        normalizedInput.endDate === undefined ? currentEmployee.endDate : normalizedInput.endDate
      );
    }

    return this.rosterRepository.updateEmployee(normalizedEmployeeId, normalizedInput);
  }

  private normalizeCreateInput(input: CreateEmployeeInput): CreateEmployeeInput {
    return {
      firstName: this.requireText(input.firstName, "First name"),
      lastName: this.requireText(input.lastName, "Last name"),
      location: this.requireText(input.location, "Location"),
      department: this.requireText(input.department, "Department"),
      releaseTrain: this.requireText(input.releaseTrain, "Release train"),
      startDate: this.requireDate(input.startDate, "Start date"),
      endDate: this.optionalDate(input.endDate, "End date"),
      coxManager: this.requireText(input.coxManager, "Cox manager"),
      billingType: this.requireBillingType(input.billingType),
      status: this.requireStatus(input.status),
      email: this.requireEmail(input.email),
      team: this.requireText(input.team, "Team"),
      teamLead: this.requireText(input.teamLead, "Team lead"),
      billRateUsd: this.requireText(input.billRateUsd, "Bill rate in $"),
      workLocation: this.requireWorkLocation(input.workLocation),
      skills: this.requireText(input.skills, "Skills")
    };
  }

  private normalizeUpdateInput(input: UpdateEmployeeInput): UpdateEmployeeInput {
    const normalizedInput: UpdateEmployeeInput = {};

    if (input.firstName !== undefined) {
      normalizedInput.firstName = this.requireText(input.firstName, "First name");
    }

    if (input.lastName !== undefined) {
      normalizedInput.lastName = this.requireText(input.lastName, "Last name");
    }

    if (input.location !== undefined) {
      normalizedInput.location = this.requireText(input.location, "Location");
    }

    if (input.department !== undefined) {
      normalizedInput.department = this.requireText(input.department, "Department");
    }

    if (input.releaseTrain !== undefined) {
      normalizedInput.releaseTrain = this.requireText(input.releaseTrain, "Release train");
    }

    if (input.startDate !== undefined) {
      normalizedInput.startDate = this.requireDate(input.startDate, "Start date");
    }

    if (input.endDate !== undefined) {
      normalizedInput.endDate = this.optionalDate(input.endDate, "End date");
    }

    if (input.coxManager !== undefined) {
      normalizedInput.coxManager = this.requireText(input.coxManager, "Cox manager");
    }

    if (input.billingType !== undefined) {
      normalizedInput.billingType = this.requireBillingType(input.billingType);
    }

    if (input.status !== undefined) {
      normalizedInput.status = this.requireStatus(input.status);
    }

    if (input.email !== undefined) {
      normalizedInput.email = this.requireEmail(input.email);
    }

    if (input.team !== undefined) {
      normalizedInput.team = this.requireText(input.team, "Team");
    }

    if (input.teamLead !== undefined) {
      normalizedInput.teamLead = this.requireText(input.teamLead, "Team lead");
    }

    if (input.billRateUsd !== undefined) {
      normalizedInput.billRateUsd = this.requireText(input.billRateUsd, "Bill rate in $");
    }

    if (input.workLocation !== undefined) {
      normalizedInput.workLocation = this.requireWorkLocation(input.workLocation);
    }

    if (input.skills !== undefined) {
      normalizedInput.skills = this.requireText(input.skills, "Skills");
    }

    return normalizedInput;
  }

  private requireText(value: string, label: string): string {
    const normalizedValue = value?.trim();
    if (!normalizedValue) {
      throw new AppError(`${label} is required`, 400);
    }

    return normalizedValue;
  }

  private requireDate(value: string, label: string): string {
    const normalizedValue = this.requireText(value, label);
    if (!this.isIsoDate(normalizedValue)) {
      throw new AppError(`${label} must be in YYYY-MM-DD format`, 400);
    }

    return normalizedValue;
  }

  private optionalDate(value: string | null, label: string): string | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    return this.requireDate(value, label);
  }

  private requireBillingType(value: BillingType): BillingType {
    if (value !== "billable" && value !== "non-billable") {
      throw new AppError("Billing type must be billable or non-billable", 400);
    }

    return value;
  }

  private requireStatus(value: EmployeeStatus): EmployeeStatus {
    if (value !== "active" && value !== "rolled-off") {
      throw new AppError("Status must be active or rolled-off", 400);
    }

    return value;
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }

  private requireEmail(value: string): string {
    const normalizedValue = this.requireText(value, "Email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      throw new AppError("Email must be a valid email address", 400);
    }
    return normalizedValue;
  }

  private requireWorkLocation(value: string): "onshore" | "offshore" {
    if (value !== "onshore" && value !== "offshore") {
      throw new AppError("Work location must be onshore or offshore", 400);
    }
    return value;
  }

  private validateDates(startDate: string, endDate: string | null): void {
    if (!endDate) {
      return;
    }

    if (Date.parse(`${endDate}T00:00:00.000Z`) < Date.parse(`${startDate}T00:00:00.000Z`)) {
      throw new AppError("End date must be on or after start date", 400);
    }
  }
}
