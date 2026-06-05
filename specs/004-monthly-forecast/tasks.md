# Tasks: Monthly Forecast Entry

**Input**: specs/004-monthly-forecast/  
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/api-contract.md

## Phase 1: Specification Governance

- [x] T001 Create forecast feature spec in spec.md
- [x] T002 Create technical plan in plan.md
- [x] T003 Document forecast data model in data-model.md
- [x] T004 Document forecast API contracts in contracts/api-contract.md
- [x] T005 Create task list in tasks.md

## Phase 2: Domain & Data Layer Implementation

- [x] T006 Create forecast domain types in src/domain/forecast.ts
- [x] T007 Create forecast repository in src/repositories/forecastRepository.ts
- [x] T008 Seed default country configurations

## Phase 3: Business Logic Implementation

- [x] T009 Create forecast service with working day calculation
- [x] T010 Implement country holiday filtering
- [x] T011 Implement pro-rata mid-month start logic
- [x] T012 Implement cutoff date enforcement

## Phase 4: API Layer Implementation

- [x] T013 Create forecast controller in src/controllers/forecastController.ts
- [x] T014 Create forecast routes in src/routes/forecastRoutes.ts
- [x] T015 Wire forecast routes into src/index.ts

## Phase 5: Testing

- [ ] T016 Add forecast smoke tests to tests/
- [ ] T017 Test country-specific holiday calculations
- [ ] T018 Test cutoff date locking behavior

## Dependency Order

- T001-T005 (governance) precede T006-T008 (data layer)
- T006-T008 precede T009-T012 (business logic)
- T009-T012 precede T013-T015 (API layer)
- T013-T015 precede T016-T018 (testing)
