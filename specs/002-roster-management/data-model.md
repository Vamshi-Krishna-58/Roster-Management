# Data Model: Roster Management API

## Entity: Roster
- Purpose: Represents one roster record managed by the API.
- Fields:
  - id (string, required, generated at creation)
  - name (string, required, non-empty after trimming)
  - createdAt (string, required, timestamp)
- Validation Rules:
  - name must be present and not blank.
  - id must be unique within current process lifetime.

## Relationships
- Roster is created by an authenticated user with authorized role.
- Roster list endpoint returns a collection of Roster entities.

## State Transitions
- Non-existent -> Created (via create roster request)
- Created -> Listed (via roster list request)
