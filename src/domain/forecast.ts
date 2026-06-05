export interface CountryHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface CountryConfig {
  countryCode: string;
  countryName: string;
  workingHoursPerDay: number;
  publicHolidays: CountryHoliday[];
}

export interface ForecastEntry {
  employeeId: string;
  forecastMonth: string; // YYYY-MM
  country: string;
  workingDays: number;
  publicHolidays: number;
  workingHoursPerDay: number;
  totalAvailableHours: number;
  hoursAdjustment: number;
  adjustedTotalHours: number;
  isProRated: boolean;
  proRataStartDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveForecastInput {
  forecastMonth: string; // YYYY-MM
  hoursAdjustment: number;
}

export interface ForecastView extends Omit<ForecastEntry, "createdAt" | "updatedAt"> {
  isLocked: boolean;
}

/**
 * Default country configurations with 2026 public holidays.
 */
export const DEFAULT_COUNTRY_CONFIGS: CountryConfig[] = [
  {
    countryCode: "US",
    countryName: "United States",
    workingHoursPerDay: 8,
    publicHolidays: [
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-01-19", name: "Martin Luther King Jr. Day" },
      { date: "2026-02-16", name: "Presidents' Day" },
      { date: "2026-05-25", name: "Memorial Day" },
      { date: "2026-07-03", name: "Independence Day (observed)" },
      { date: "2026-09-07", name: "Labor Day" },
      { date: "2026-10-12", name: "Columbus Day" },
      { date: "2026-11-11", name: "Veterans Day" },
      { date: "2026-11-26", name: "Thanksgiving Day" },
      { date: "2026-12-25", name: "Christmas Day" }
    ]
  },
  {
    countryCode: "AU",
    countryName: "Australia",
    workingHoursPerDay: 8,
    publicHolidays: [
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-01-26", name: "Australia Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-04-06", name: "Easter Monday" },
      { date: "2026-04-25", name: "ANZAC Day" },
      { date: "2026-06-08", name: "Queen's Birthday" },
      { date: "2026-12-25", name: "Christmas Day" },
      { date: "2026-12-28", name: "Boxing Day (observed)" }
    ]
  },
  {
    countryCode: "IN",
    countryName: "India",
    workingHoursPerDay: 8,
    publicHolidays: [
      { date: "2026-01-26", name: "Republic Day" },
      { date: "2026-03-10", name: "Maha Shivaratri" },
      { date: "2026-03-31", name: "Id-ul-Fitr" },
      { date: "2026-04-02", name: "Ram Navami" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
      { date: "2026-05-01", name: "May Day" },
      { date: "2026-06-07", name: "Id-ul-Zuha" },
      { date: "2026-07-06", name: "Muharram" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-09-04", name: "Milad-un-Nabi" },
      { date: "2026-10-02", name: "Mahatma Gandhi Jayanti" },
      { date: "2026-10-20", name: "Dussehra" },
      { date: "2026-11-09", name: "Diwali" },
      { date: "2026-11-10", name: "Diwali (Day 2)" },
      { date: "2026-12-25", name: "Christmas Day" }
    ]
  }
];
