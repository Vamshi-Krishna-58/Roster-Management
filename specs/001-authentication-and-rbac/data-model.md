# Data Model: Authentication And RBAC

## Entity: User Identity
- Purpose: Represents an authenticated principal used for authorization decisions.
- Fields:
  - userId (string, required)
  - username (string, required)
  - role (enum: admin | scheduler | viewer, required)
- Validation Rules:
  - role must be one of supported role values.
  - userId and username must be present for authenticated request context.

## Entity: Access Token
- Purpose: Represents the bearer credential issued on successful login.
- Fields:
  - accessToken (string, required)
  - expiresIn (number of seconds, required)
  - subject user reference (required)
  - role claim (required)
- Validation Rules:
  - token must be signed with configured secret.
  - token must not be expired.
  - required claims must be present for request acceptance.

## Entity: Role Policy
- Purpose: Maps user roles to endpoint permissions.
- Rules:
  - viewer: can list rosters only.
  - scheduler: can list and create rosters.
  - admin: can list and create rosters.

## Relationships
- User Identity issues Access Token after successful credential check.
- Access Token carries Role information used by Role Policy checks.
