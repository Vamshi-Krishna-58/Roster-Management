# Data Model: Monthly Forecast Entry

## Entity: ForecastEntry
- Purpose: Represents one resource's forecasted availability for a specific month.
- Fields:
  - employeeId (string, required, partition key — references EmployeeRecord)
  - forecastMonth (string, required, sort key — format YYYY-MM)
  - country (string, required — resource's country of residence)
  - workingDays (number, required — weekdays Mon-Fri in the month)
  - publicHolidays (number, required — country holidays in the period)
  - workingHoursPerDay (number, required — from country config, default 8)
  - totalAvailableHours (number, required — (workingDays - publicHolidays) * workingHoursPerDay)
  - hoursAdjustment (number, required — positive, negative, or zero)
  - adjustedTotalHours (number, required — totalAvailableHours + hoursAdjustment)
  - isProRated (boolean, required — true if resource started mid-month)
  - proRataStartDate (string | null — the start date used for pro-rata calculation)
  - isCutoffLocked (boolean, derived — true if current date is past cutoff)
  - createdAt (string, required, ISO timestamp)
  - updatedAt (string, required, ISO timestamp)
- Validation Rules:
  - forecastMonth must be in YYYY-MM format.
  - hoursAdjustment may be any integer (positive, negative, or zero).
  - adjustedTotalHours = totalAvailableHours + hoursAdjustment.
  - Forecasts cannot be created or updated after the cutoff date for that month.

## Entity: CountryConfig
- Purpose: Stores country-level configuration for working hours and public holidays.
- Fields:
  - countryCode (string, required, partition key — e.g. "US", "AU")
  - countryName (string, required)
  - workingHoursPerDay (number, required, default 8)
  - publicHolidays (array of objects, required)
    - date (string, YYYY-MM-DD)
    - name (string)
- Validation Rules:
  - countryCode must be a non-empty string.
  - workingHoursPerDay must be a positive number.
  - Holiday dates must be valid ISO dates.

## Relationships
- ForecastEntry references EmployeeRecord via employeeId.
- ForecastEntry uses CountryConfig to determine working hours per day and holiday count.
- One EmployeeRecord can have up to 3 active ForecastEntry records (current + next 2 months).

## State Transitions
- Non-existent → Created (resource saves forecast before cutoff)
- Created → Updated (resource edits forecast before cutoff)
- Created/Updated → Locked (cutoff date passes, forecast becomes read-only)

## DynamoDB Key Design
- ForecastEntry table:
  - PK: `employeeId`
  - SK: `forecastMonth` (YYYY-MM)
- CountryConfig table:
  - PK: `countryCode`
