# API Contract: Monthly Forecast

## Endpoint: GET /api/v1/forecasts

### Access
- Requires valid bearer token.
- Returns forecasts for the authenticated user.
- Allowed roles: admin, scheduler, viewer.

### Success Response
- Status: 200
- Body:
  - items: array of forecast entry objects
    - employeeId (string)
    - forecastMonth (string, YYYY-MM)
    - country (string)
    - workingDays (number)
    - publicHolidays (number)
    - workingHoursPerDay (number)
    - totalAvailableHours (number)
    - hoursAdjustment (number)
    - adjustedTotalHours (number)
    - isProRated (boolean)
    - proRataStartDate (string | null)
    - isLocked (boolean)

## Endpoint: GET /api/v1/forecasts/:employeeId

### Access
- Requires valid bearer token.
- Allowed roles: admin, scheduler.

### Success Response
- Status: 200
- Body:
  - items: array of forecast entry objects (same shape as above)

### Error Responses
- 403 when viewer role attempts access.
- 404 when employee not found.

## Endpoint: PUT /api/v1/forecasts

### Access
- Requires valid bearer token.
- Saves forecasts for the authenticated user.
- Allowed roles: admin, scheduler, viewer.

### Request
- Content-Type: application/json
- Body:
  - entries: array of objects
    - forecastMonth (string, YYYY-MM, required)
    - hoursAdjustment (number, required)

### Success Response
- Status: 200
- Body:
  - items: array of saved forecast entry objects
  - message: "Forecast saved successfully"

### Error Responses
- 400 when forecastMonth format is invalid.
- 400 when hoursAdjustment is not a number.
- 403 when attempting to save a locked (post-cutoff) month.
- 401 when token is missing/invalid.
