# Specs Index

This folder is the source of truth for spec-driven delivery in this repository.

## Baseline Feature Specs

- 001-authentication-and-rbac
  - Captures login, JWT validation, and role-based authorization behavior.
- 002-roster-management
  - Captures roster listing and creation behavior under protected endpoints.
- 003-mega-roster-tool
  - Defines full lifecycle requirements for resources, engagements, projects, assignments, timesheets, access control, and reports.

## Working Rule

All future behavior changes should start by creating a new numbered feature folder using /speckit.specify.
Code changes should link back to one governing spec folder in this directory.
