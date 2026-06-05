# Implementation Plan: Monthly Forecast Entry

**Branch**: `004-monthly-forecast` | **Date**: 2026-04-20 | **Spec**: specs/004-monthly-forecast/spec.md

## Summary

Add monthly forecast entry capability allowing active roster members to view and submit their forecasted availability hours for the current and next two months, accounting for country-specific holidays and mid-month starts.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: express, @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb  
**Storage**: DynamoDB with in-memory fallback (follows existing pattern)  
**Testing**: vitest, supertest  
**Target Platform**: Node.js / AWS Lambda  
**Project Type**: Backend API service  
**Constraints**: Follow existing layered architecture (domain → repository → service → controller → routes)

## Constitution Check

- Spec-first workflow applied: PASS
- Layer boundaries respected: PASS
- Required test coverage for behavior changes: PASS
- Backward compatibility for existing routes: PASS

## Phase 1: Domain & Data Layer

1. Create `src/domain/forecast.ts` — ForecastEntry, CountryConfig, and input types.
2. Create `src/repositories/forecastRepository.ts` — DynamoDB CRUD with in-memory fallback.
3. Seed default country configs (US, AU, IN) with 2026 holidays.

## Phase 2: Business Logic

4. Create `src/services/forecastService.ts`:
   - Calculate working days (Mon-Fri) for a month.
   - Subtract country holidays falling on working days.
   - Handle pro-rata for mid-month start.
   - Enforce cutoff date logic.
   - Calculate totals and adjusted totals.

## Phase 3: API Layer

5. Create `src/controllers/forecastController.ts` — request/response mapping.
6. Create `src/routes/forecastRoutes.ts` — Express routes with auth middleware.
7. Wire forecast routes into `src/index.ts`.

## Phase 4: API Contract

- GET /api/v1/forecasts — list forecast for authenticated resource (current + 2 months).
- PUT /api/v1/forecasts — save/update forecast entries for authenticated resource.
- GET /api/v1/forecasts/:employeeId — admin/scheduler view of a specific resource's forecast.

## Post-Design Constitution Check

- No constitutional violations identified.
