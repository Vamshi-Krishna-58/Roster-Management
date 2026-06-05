# Feature Specification: Monthly Forecast Entry

**Feature Branch**: `004-monthly-forecast`  
**Created**: 2026-04-20  
**Status**: New  
**Input**: Forecast availability tracking for active roster members

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View forecast panel (Priority: P1)

As a resource active on a project roster, I want to view my forecasted availability for the current and next two months so I can plan my capacity.

**Why this priority**: Viewing forecast data is the foundational read capability for capacity planning.

**Independent Test**: Use a valid token for an active resource and verify the forecast panel returns three months of data.

**Acceptance Scenarios**:

1. **Given** an active resource, **When** forecast section is viewed, **Then** entries for current month and next 2 months are shown.
2. **Given** a month with 22 working days and 2 holidays at 8 hrs/day, **When** forecast is viewed, **Then** total hours = (22-2)*8 = 160.
3. **Given** a resource based in US, **When** forecast is viewed, **Then** US public holidays are applied.
4. **Given** a resource based in Australia, **When** forecast is viewed, **Then** Australian public holidays are applied.

---

### User Story 2 - Enter hours adjustment (Priority: P1)

As a resource, I want to enter an hours adjustment (positive or negative) for each month so the team has an accurate picture of my availability.

**Why this priority**: Adjustment entry is the core write operation for forecast accuracy.

**Independent Test**: Enter an adjustment of -8 for a month with 160 base hours and verify adjusted total = 152.

**Acceptance Scenarios**:

1. **Given** 160 base hours and adjustment +8, **Then** adjusted total = 168.
2. **Given** 160 base hours and adjustment -16, **Then** adjusted total = 144.
3. **Given** 160 base hours and adjustment 0, **Then** adjusted total = 160.
4. **Given** no adjustment entered, **When** forecast saved, **Then** adjusted total = base total (zero adjustment).

---

### User Story 3 - Save and edit forecast (Priority: P1)

As a resource, I want to save my forecast and edit it before the cutoff date.

**Why this priority**: Persistence is required for the forecast to be useful to the team.

**Independent Test**: Save a forecast, retrieve it, update adjustment, save again, verify new value persisted.

**Acceptance Scenarios**:

1. **Given** before cutoff, **When** forecast is saved, **Then** adjusted total is persisted and confirmation returned.
2. **Given** forecasts for all three months, **When** saved, **Then** all three are persisted.
3. **Given** a previously saved forecast before cutoff, **When** adjustment updated and saved, **Then** new value replaces old.
4. **Given** after cutoff, **Then** adjustment field is read-only and save is rejected.

---

### User Story 4 - Pro-rata for mid-month start (Priority: P2)

As a resource who started mid-month, I want my forecast to reflect only my active working days.

**Why this priority**: Ensures accurate capacity for partial-month resources.

**Independent Test**: Resource starting on 10th of month with 14 remaining working days, 1 holiday after start, 8 hrs/day → total = (14-1)*8 = 104.

**Acceptance Scenarios**:

1. **Given** start date on 10th with 14 working days remaining and 1 holiday after start, **Then** total = 104 with pro-rata indicator.
2. **Given** start date on 1st, **Then** full month calculated, no pro-rata indicator.
3. **Given** mid-month start, **When** viewing next month, **Then** next month shows full month (not pro-rated).

---

### User Story 5 - Inactive resource exclusion (Priority: P2)

An inactive roster member should not see forecast entry.

**Acceptance Scenarios**:

1. **Given** resource is not active on roster this month, **When** navigating to forecast, **Then** no forecast entry is shown.

### Edge Cases

- Resource with no country configured.
- Country with no holidays configured.
- Adjustment that would result in negative total hours.
- Saving forecast exactly on cutoff date boundary.
- Resource active in one month but rolled off in next.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display forecast entries for current month and next 2 months for active resources.
- **FR-002**: The system MUST calculate working days as weekdays (Mon-Fri) minus public holidays for the resource's country.
- **FR-003**: The system MUST calculate total available hours as (working days - holidays) * working hours per day.
- **FR-004**: The system MUST allow resources to enter an hours adjustment (positive, negative, or zero) per month.
- **FR-005**: The system MUST calculate adjusted total as total available hours + adjustment.
- **FR-006**: The system MUST persist forecast entries on save.
- **FR-007**: The system MUST allow editing saved forecasts before the cutoff date.
- **FR-008**: The system MUST lock forecast entries after the cutoff date (read-only).
- **FR-009**: The system MUST pro-rate the first month for resources starting mid-month.
- **FR-010**: The system MUST only show forecasts for months where the resource is active.
- **FR-011**: The system MUST apply country-specific public holidays.
- **FR-012**: The system MUST store country working hours per day configuration.

### Key Entities *(include if feature involves data)*

- **ForecastEntry**: Represents a resource's forecast for a specific month.
- **CountryConfig**: Represents a country's working hours per day and public holidays.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Active resource can view three months of forecast data with correct working day and holiday calculations.
- **SC-002**: Hours adjustments correctly modify the adjusted total.
- **SC-003**: Forecasts are persisted and retrievable.
- **SC-004**: Forecasts are locked after cutoff date.
- **SC-005**: Mid-month start resources see pro-rated first month.
- **SC-006**: Country-specific holidays produce different results for resources in different countries.

## Assumptions

- Cutoff date is configurable (default: 5th of the month for that month's forecast).
- Country holiday data is seeded/configured by admin.
- Working hours per day defaults to 8 if not configured for a country.
- Forecast months always start from the current calendar month.
