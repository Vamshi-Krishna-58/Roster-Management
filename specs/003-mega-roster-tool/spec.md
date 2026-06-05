# Feature Specification: Mega Roster Tool

**Feature Branch**: `003-mega-roster-tool`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Mega Roster Tool"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Engagement Lifecycle Without Conflicts (Priority: P1)

As a PMO or Admin user, I can create and transition engagement records for a resource through hard-lock and roll-on/off lifecycles while enforcing date and overlap constraints.

**Why this priority**: Engagement state controls whether resource time can be entered and is foundational for all downstream planning and timesheet behavior.

**Independent Test**: Create resource engagement records and execute allowed/blocked transitions while validating date constraints and overlap prevention.

**Acceptance Scenarios**:

1. **Given** a resource with no active engagement, **When** a user starts a hard lock with a valid date on/after engagement start date, **Then** status becomes Hard Lock Active.
2. **Given** a resource in Hard Lock Active, **When** a user releases hard lock, **Then** status becomes Hard Lock Released and release date is set to current day.
3. **Given** a resource in Roll On In Progress, **When** roll on is completed, **Then** status becomes Rolled On.
4. **Given** a resource with an active hard lock, **When** roll on is initiated, **Then** the request is rejected.
5. **Given** a resource with overlapping engagement dates, **When** a new engagement record is created, **Then** the request is rejected.

---

### User Story 2 - Allocate Resources to Projects Safely (Priority: P1)

As a Project Lead or PMO user, I can manage projects and assignments with allocation and date validation so a resource is never over-allocated.

**Why this priority**: Project and assignment integrity directly impacts staffing and billing outcomes.

**Independent Test**: Create project and assignment records and verify required fields, date boundaries, and aggregate allocation limits.

**Acceptance Scenarios**:

1. **Given** a project with required fields, **When** it is created, **Then** project stores name, delivery lead, start date, end date, and investment flag.
2. **Given** an assignment request with allocation between 1 and 100 and valid dates, **When** it is created, **Then** assignment is stored successfully.
3. **Given** a new assignment that pushes daily allocation above 100% for a resource, **When** it is submitted, **Then** the request is rejected.
4. **Given** an assignment with missing mandatory fields, **When** it is submitted, **Then** the request is rejected.

---

### User Story 3 - Capture Weekly Timesheets Within Policy (Priority: P1)

As a User, Project Lead, PMO, or Admin, I can submit and edit weekly timesheets subject to assignment bounds, engagement state, and lock-date permissions.

**Why this priority**: Time capture is the primary business outcome and must remain compliant with assignment and policy rules.

**Independent Test**: Submit timesheet entries for a week and validate assignment window checks, lock-date behavior, and role permissions.

**Acceptance Scenarios**:

1. **Given** a week identified by Monday date, **When** a timesheet is opened, **Then** assignment lines for that period and a fixed non-working line are displayed.
2. **Given** a time entry outside assignment start/end dates, **When** it is submitted, **Then** the request is rejected.
3. **Given** a resource in Rolled Off status, **When** timesheet time is submitted, **Then** the request is rejected.
4. **Given** a submitted day earlier than lock date, **When** a PMO edits it, **Then** the request is rejected.
5. **Given** a submitted day earlier than lock date, **When** an Admin edits it, **Then** the update is allowed.

---

### User Story 4 - Enforce Role-Based Access Across Modules (Priority: P2)

As a system owner, I can enforce module permissions by role so users can only perform actions allowed for Admin, PMO, Project Lead, and User access levels.

**Why this priority**: Access boundaries reduce unauthorized data changes and reflect operating governance.

**Independent Test**: Execute representative project, assignment, engagement, timesheet, and report actions using each role and verify allow/deny outcomes.

**Acceptance Scenarios**:

1. **Given** a User role, **When** managing projects or assignments is attempted, **Then** access is denied.
2. **Given** a Project Lead role, **When** creating engagement records and running reports, **Then** access is allowed.
3. **Given** a PMO role, **When** editing other users' timesheets after lock date, **Then** access is allowed.
4. **Given** an Admin role, **When** editing time data before lock date, **Then** access is allowed.

---

### User Story 5 - Run Canned Reports (Priority: P3)

As a Project Lead, PMO, or Admin user, I can run predefined reports from a report catalog.

**Why this priority**: Reporting is valuable but depends on core data correctness from engagement, assignment, and timesheet workflows.

**Independent Test**: Select each canned report option and verify successful generation with role-appropriate access.

**Acceptance Scenarios**:

1. **Given** an allowed role, **When** a report is selected and executed, **Then** the report output is returned.
2. **Given** a disallowed role, **When** a report is requested, **Then** access is denied.

### Edge Cases

- Input text fields include extra leading/trailing whitespace.
- Dates are provided before configured engagement start date.
- End dates are before start dates.
- Duplicate resources are attempted with same enterprise ID.
- Multiple lifecycle transitions are attempted concurrently for the same resource.
- Week definition crosses month/year boundaries but must still map Monday-Sunday.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim all text fields before persistence.
- **FR-002**: System MUST reject missing start dates where start date is required.
- **FR-003**: System MUST reject end dates earlier than start dates.
- **FR-004**: System MUST reject date inputs earlier than configured engagement start date.
- **FR-005**: System MUST preserve audit history of data changes.
- **FR-006**: System MUST treat weeks as Monday through Sunday.
- **FR-007**: System MUST use enterprise ID as unique resource identifier.
- **FR-008**: System MUST prevent duplicate resource records by enterprise ID.
- **FR-009**: System MUST allow exactly one active engagement status per resource at a time.
- **FR-010**: System MUST support engagement statuses: null, Hard Lock Active, Hard Lock Released, Roll On In Progress, Rolled On, Rolling Off, Rolled Off.
- **FR-011**: System MUST enforce allowed lifecycle transitions for hard lock and roll on/off paths.
- **FR-012**: System MUST block hard lock creation for resources already rolling on, rolled on, or rolling off.
- **FR-013**: System MUST set hard lock release date to current day when released.
- **FR-014**: System MUST block roll on initiation while hard lock is active.
- **FR-015**: System MUST prevent overlapping engagement records for the same resource.
- **FR-016**: System MUST require user to specify hard lock vs roll on mode when creating engagement.
- **FR-017**: System MUST display engagement history for each resource.
- **FR-018**: System MUST store project attributes: name, delivery lead resource, start date, end date, and investment flag.
- **FR-019**: System MUST store assignment attributes: resource, project, allocation (1-100 whole number), start date, end date, hourly rate (USD), non-billable flag.
- **FR-020**: System MUST reject assignment creation when mandatory fields are missing.
- **FR-021**: System MUST enforce that a resource total allocation does not exceed 100% for any day.
- **FR-022**: System MUST generate timesheets identified by the Monday date of the week.
- **FR-023**: System MUST include one fixed non-working line on each timesheet.
- **FR-024**: System MUST reject project-line time entries outside assignment date bounds.
- **FR-025**: System MUST reject time entry for resources in Rolled Off status.
- **FR-026**: System MUST enforce lock-date edits: PMO blocked before lock date, Admin allowed before lock date.
- **FR-027**: System MUST support access levels: Admin, PMO, Project Lead, User.
- **FR-028**: System MUST default new users to User access level.
- **FR-029**: System MUST allow all resources present in engagement table to access the application regardless of engagement state.
- **FR-030**: System MUST expose a report section with selectable canned reports.

### Key Entities *(include if feature involves data)*

- **Resource**: Person identified by unique enterprise ID with assigned access level.
- **EngagementRecord**: Lifecycle-bound association of a resource with status transitions, lock/roll dates, and history.
- **Project**: Deliverable unit with name, lead, date range, and investment flag.
- **Assignment**: Link between resource and project with allocation, date range, billing attributes, and hourly rate.
- **Timesheet**: Weekly record keyed by Monday date containing assignment line entries and fixed non-working line.
- **TimeEntry**: Daily hours against assignment or non-working line bounded by assignment and policy rules.
- **ReportDefinition**: Canned report metadata available for execution by authorized roles.
- **SystemConfiguration**: Config values such as engagement start date and lock date.
- **AuditEvent**: Immutable change log capturing who changed what and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of invalid date and lifecycle transitions are rejected with deterministic validation responses in automated tests.
- **SC-002**: 100% of attempted over-allocation scenarios are blocked in automated tests.
- **SC-003**: 100% of unauthorized role-action combinations are denied according to access matrix.
- **SC-004**: 100% of timesheet submissions outside assignment bounds or Rolled Off status are rejected.
- **SC-005**: Engagement, assignment, and timesheet critical workflows are covered by end-to-end acceptance tests for Admin, PMO, Project Lead, and User roles.

## Assumptions

- This feature defines business behavior first; final API and UI contracts are produced in follow-up planning artifacts.
- Monetary values are stored in USD with explicit numeric precision rules to be finalized in planning.
- Report outputs are viewable/exportable through predefined report definitions; ad-hoc reporting is out of scope.
- Time entry granularity is daily within a weekly timesheet context.
- Audit history is immutable and queryable for supported entities.
