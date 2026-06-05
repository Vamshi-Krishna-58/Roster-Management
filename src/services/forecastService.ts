import type { ForecastEntry, ForecastView, SaveForecastInput } from "../domain/forecast";
import { AppError } from "../errors/AppError";
import { ForecastRepository } from "../repositories/forecastRepository";
import { RosterRepository } from "../repositories/rosterRepository";

const DEFAULT_CUTOFF_DAY = 5;
const DEFAULT_WORKING_HOURS = 8;

export class ForecastService {
  public constructor(
    private readonly forecastRepository: ForecastRepository,
    private readonly rosterRepository: RosterRepository,
    private readonly cutoffDay: number = DEFAULT_CUTOFF_DAY
  ) {}

  public async getForecasts(employeeId: string): Promise<ForecastView[]> {
    const employee = await this.findEmployee(employeeId);
    const countryConfig = this.forecastRepository.getCountryConfig(employee.location);
    const workingHoursPerDay = countryConfig?.workingHoursPerDay ?? DEFAULT_WORKING_HOURS;
    const holidays = countryConfig?.publicHolidays ?? [];

    const months = this.getForecastMonths();
    const existingForecasts = await this.forecastRepository.getForecasts(employeeId);
    const existingMap = new Map(existingForecasts.map((f) => [f.forecastMonth, f]));

    const now = new Date();
    const views: ForecastView[] = [];

    for (const month of months) {
      const isActive = this.isActiveInMonth(employee.status, employee.startDate, employee.endDate, month);
      if (!isActive) {
        continue;
      }

      const existing = existingMap.get(month);
      const isLocked = this.isMonthLocked(month, now);

      const { isProRated, proRataStartDate } = this.getProRataInfo(employee.startDate, month);
      const startDate = isProRated ? employee.startDate : undefined;

      const workingDays = this.countWorkingDays(month, startDate);
      const holidayCount = this.countHolidaysInPeriod(holidays, month, startDate);
      const totalAvailableHours = (workingDays - holidayCount) * workingHoursPerDay;
      const hoursAdjustment = existing?.hoursAdjustment ?? 0;
      const adjustedTotalHours = totalAvailableHours + hoursAdjustment;

      views.push({
        employeeId,
        forecastMonth: month,
        country: employee.location,
        workingDays,
        publicHolidays: holidayCount,
        workingHoursPerDay,
        totalAvailableHours,
        hoursAdjustment,
        adjustedTotalHours,
        isProRated,
        proRataStartDate,
        isLocked
      });
    }

    return views;
  }

  public async getAllForecasts(): Promise<ForecastView[]> {
    const allEntries = await this.forecastRepository.getAllForecasts();
    const months = new Set(this.getForecastMonths());
    const now = new Date();

    return allEntries
      .filter((e) => months.has(e.forecastMonth))
      .map((e) => ({
        employeeId: e.employeeId,
        forecastMonth: e.forecastMonth,
        country: e.country,
        workingDays: e.workingDays,
        publicHolidays: e.publicHolidays,
        workingHoursPerDay: e.workingHoursPerDay,
        totalAvailableHours: e.totalAvailableHours,
        hoursAdjustment: e.hoursAdjustment,
        adjustedTotalHours: e.adjustedTotalHours,
        isProRated: e.isProRated ?? false,
        proRataStartDate: e.proRataStartDate,
        isLocked: this.isMonthLocked(e.forecastMonth, now)
      }));
  }

  public async saveForecasts(employeeId: string, inputs: SaveForecastInput[]): Promise<ForecastView[]> {
    if (!inputs || inputs.length === 0) {
      throw new AppError("At least one forecast entry is required", 400);
    }

    const employee = await this.findEmployee(employeeId);
    const countryConfig = this.forecastRepository.getCountryConfig(employee.location);
    const workingHoursPerDay = countryConfig?.workingHoursPerDay ?? DEFAULT_WORKING_HOURS;
    const holidays = countryConfig?.publicHolidays ?? [];
    const now = new Date();
    const timestamp = now.toISOString();

    const validMonths = new Set(this.getForecastMonths());
    const savedViews: ForecastView[] = [];

    for (const input of inputs) {
      this.validateForecastMonth(input.forecastMonth);

      if (!validMonths.has(input.forecastMonth)) {
        throw new AppError(`Forecast month ${input.forecastMonth} is not in the allowed range`, 400);
      }

      if (this.isMonthLocked(input.forecastMonth, now)) {
        throw new AppError(`Forecast for ${input.forecastMonth} is locked (past cutoff date)`, 403);
      }

      if (typeof input.hoursAdjustment !== "number" || Number.isNaN(input.hoursAdjustment)) {
        throw new AppError("Hours adjustment must be a number", 400);
      }

      const isActive = this.isActiveInMonth(employee.status, employee.startDate, employee.endDate, input.forecastMonth);
      if (!isActive) {
        throw new AppError(`Resource is not active in ${input.forecastMonth}`, 400);
      }

      const { isProRated, proRataStartDate } = this.getProRataInfo(employee.startDate, input.forecastMonth);
      const startDate = isProRated ? employee.startDate : undefined;

      const workingDays = this.countWorkingDays(input.forecastMonth, startDate);
      const holidayCount = this.countHolidaysInPeriod(holidays, input.forecastMonth, startDate);
      const totalAvailableHours = (workingDays - holidayCount) * workingHoursPerDay;
      const adjustedTotalHours = totalAvailableHours + input.hoursAdjustment;

      const entry: ForecastEntry = {
        employeeId,
        forecastMonth: input.forecastMonth,
        country: employee.location,
        workingDays,
        publicHolidays: holidayCount,
        workingHoursPerDay,
        totalAvailableHours,
        hoursAdjustment: input.hoursAdjustment,
        adjustedTotalHours,
        isProRated,
        proRataStartDate,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await this.forecastRepository.saveForecast(entry);

      savedViews.push({
        employeeId: entry.employeeId,
        forecastMonth: entry.forecastMonth,
        country: entry.country,
        workingDays: entry.workingDays,
        publicHolidays: entry.publicHolidays,
        workingHoursPerDay: entry.workingHoursPerDay,
        totalAvailableHours: entry.totalAvailableHours,
        hoursAdjustment: entry.hoursAdjustment,
        adjustedTotalHours: entry.adjustedTotalHours,
        isProRated: entry.isProRated,
        proRataStartDate: entry.proRataStartDate,
        isLocked: false
      });
    }

    return savedViews;
  }

  private async findEmployee(employeeId: string) {
    const employees = await this.rosterRepository.listEmployees();
    const employee = employees.find((e) => e.employeeId === employeeId);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    return employee;
  }

  private getForecastMonths(): string[] {
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${year}-${month}`);
    }
    return months;
  }

  private isMonthLocked(forecastMonth: string, now: Date): boolean {
    const [yearStr, monthStr] = forecastMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1;
    const cutoffDate = new Date(year, month, this.cutoffDay, 23, 59, 59, 999);
    return now > cutoffDate;
  }

  private isActiveInMonth(
    status: string,
    startDate: string,
    endDate: string | null,
    forecastMonth: string
  ): boolean {
    if (status !== "active") {
      return false;
    }

    const [yearStr, monthStr] = forecastMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // last day of month

    const empStart = new Date(startDate + "T00:00:00");
    if (empStart > monthEnd) {
      return false;
    }

    if (endDate) {
      const empEnd = new Date(endDate + "T00:00:00");
      if (empEnd < monthStart) {
        return false;
      }
    }

    return true;
  }

  private getProRataInfo(startDate: string, forecastMonth: string): { isProRated: boolean; proRataStartDate: string | null } {
    const [yearStr, monthStr] = forecastMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1;
    const monthFirstDay = new Date(year, month, 1);

    const empStart = new Date(startDate + "T00:00:00");

    if (empStart > monthFirstDay && empStart.getMonth() === month && empStart.getFullYear() === year) {
      return { isProRated: true, proRataStartDate: startDate };
    }

    return { isProRated: false, proRataStartDate: null };
  }

  private countWorkingDays(forecastMonth: string, startDate?: string): number {
    const [yearStr, monthStr] = forecastMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1;

    let firstDay: Date;
    if (startDate) {
      firstDay = new Date(startDate + "T00:00:00");
    } else {
      firstDay = new Date(year, month, 1);
    }

    const lastDay = new Date(year, month + 1, 0);
    let count = 0;

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
    }

    return count;
  }

  private countHolidaysInPeriod(
    holidays: Array<{ date: string; name: string }>,
    forecastMonth: string,
    startDate?: string
  ): number {
    const [yearStr, monthStr] = forecastMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10) - 1;

    let periodStart: Date;
    if (startDate) {
      periodStart = new Date(startDate + "T00:00:00");
    } else {
      periodStart = new Date(year, month, 1);
    }

    const periodEnd = new Date(year, month + 1, 0);
    let count = 0;

    for (const holiday of holidays) {
      const hDate = new Date(holiday.date + "T00:00:00");
      if (hDate >= periodStart && hDate <= periodEnd) {
        const dayOfWeek = hDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
      }
    }

    return count;
  }

  private validateForecastMonth(value: string): void {
    if (!/^\d{4}-\d{2}$/.test(value)) {
      throw new AppError("Forecast month must be in YYYY-MM format", 400);
    }

    const [yearStr, monthStr] = value.split("-");
    const month = Number.parseInt(monthStr, 10);
    if (month < 1 || month > 12) {
      throw new AppError("Forecast month must be a valid month (01-12)", 400);
    }

    const year = Number.parseInt(yearStr, 10);
    if (year < 2000 || year > 2100) {
      throw new AppError("Forecast year is out of range", 400);
    }
  }
}
