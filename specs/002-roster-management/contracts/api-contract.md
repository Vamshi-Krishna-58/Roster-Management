# API Contract: Roster Management

## Endpoint: GET /api/v1/rosters

### Access
- Requires valid bearer token.
- Allowed roles: admin, scheduler, viewer.

### Success Response
- Status: 200
- Body:
  - items: array of roster objects

## Endpoint: POST /api/v1/rosters

### Access
- Requires valid bearer token.
- Allowed roles: admin, scheduler.

### Request
- Content-Type: application/json
- Body:
  - name (string, required)

### Success Response
- Status: 201
- Body:
  - item:
    - id (string)
    - name (string)
    - createdAt (timestamp string)

### Error Responses
- 400 when roster name is missing or blank.
- 401 when token is missing/invalid.
- 403 when role lacks permission.

## Global Error Contract

### Unknown Route
- Status: 404
- Body:
  - error (string)
