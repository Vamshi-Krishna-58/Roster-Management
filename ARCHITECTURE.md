# Cox Roster Management — Architecture Document

## 1. Purpose and Scope

Cox Roster Management is a full-stack application used to manage employee roster data, role-based access, and forecast adjustments. It provides:

- A browser-based UI for roster operations and reporting
- A REST API for auth, roster, and forecast workflows
- Persistence using DynamoDB (with in-memory fallback for local runs)
- Optional AWS cloud deployment using CDK (S3 + CloudFront + API Gateway + Lambda + DynamoDB)

---

## 2. High-Level Architecture

```text
+----------------------+         HTTPS         +-----------------------------+
|  Browser UI          | --------------------> |  Express App (Node/TS)      |
|  (public/index.html) |                      |  Controllers + Services     |
+----------------------+ <-------------------- |  + JWT/RBAC Middleware      |
                                              +---------------+-------------+
                                                              |
                                                              |
                                                     +--------v--------+
                                                     | Repositories     |
                                                     | DynamoDB / Memory|
                                                     +--------+--------+
                                                              |
                              +-------------------------------+-------------------------------+
                              |                                                               |
                      +-------v--------+                                              +-------v--------+
                      | Roster Table   |                                              | Forecast Table |
                      | (employeeId PK)|                                              | employeeId PK  |
                      +----------------+                                              | forecastMonth SK|
                                                                                      +----------------+
```

---

## 3. Runtime Components

### 3.1 Frontend

- Location: `public/index.html`, `public/app.css`, `public/images/*`
- Technology: React (UMD + Babel in browser)
- Responsibilities:
  - Login token handling in browser storage
  - Roster, project, assignment, and forecast interactions
  - Calling backend APIs under `/api/v1/*`

### 3.2 Backend API

- Entry points:
  - `src/server.ts` (local HTTP server)
  - `src/lambda.ts` (AWS Lambda handler)
- App assembly: `src/index.ts`
- Middleware:
  - JWT authentication (`authenticateJwt`)
  - Role authorization (`authorizeRoles`, `requireAdmin`)
  - Global error and not-found handlers

### 3.3 Application Layers

- **Controllers**: map HTTP requests/responses
- **Services**: business rules and validation
- **Repositories**: data access abstraction for DynamoDB/in-memory behavior

---

## 4. API Surface

### Health
- `GET /health`

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/users` (admin)
- `GET /api/v1/users` (admin)

### Roster
- `GET /api/v1/employees` (admin/scheduler/viewer)
- `POST /api/v1/employees` (admin/scheduler)
- `PATCH /api/v1/employees/:employeeId` (admin/scheduler)

### Forecast
- `GET /api/v1/forecasts` (admin/scheduler/viewer)
- `PUT /api/v1/forecasts` (admin/scheduler/viewer)
- `GET /api/v1/forecasts/all` (admin/scheduler)
- `GET /api/v1/forecasts/:employeeId` (admin/scheduler)

---

## 5. Security Architecture

### 5.1 Application Security

- JWT-based auth for `/api/v1/*`
- Role-based authorization enforced per route
- Admin-only user management endpoints
- Centralized error handling

### 5.2 Cloud Security (CDK deployment)

- S3 bucket is private (no public bucket access)
- CloudFront with HTTPS redirect
- CloudFront security headers policy
- AWS WAF managed rules + IP rate limiting
- DynamoDB encryption at rest (AWS managed)
- Point-in-time recovery for DynamoDB tables

---

## 6. Data Architecture

### Roster Table
- Partition key: `employeeId` (string)
- Employee profile, engagement status, billing, org attributes

### Forecast Table
- Partition key: `employeeId` (string)
- Sort key: `forecastMonth` (string)
- Stores forecast hour adjustments and totals by month

---

## 7. Deployment Architecture

### Local Development

- `npm run dev` launches Express app
- UI and API are served from the same origin

### AWS Deployment (CDK)

- Static UI in S3
- CloudFront distribution fronts both:
  - Static content from S3
  - API paths (`/api/*`, `/health`) routed to API Gateway
- API Gateway proxies to Lambda
- Lambda reads/writes DynamoDB

---

## 8. Configuration

Environment is loaded from `.env` through `src/config/env.ts`.

Important variables:

- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN_SECONDS`
- `AWS_REGION`
- `DYNAMODB_TABLE_NAME`
- `FORECAST_TABLE_NAME`
- `DYNAMODB_ENDPOINT`

---

## 9. Non-Functional Characteristics

- Layered design improves maintainability and testability
- Role guardrails prevent privilege escalation in API usage
- Stateless API supports horizontal scaling in Lambda
- Managed services reduce operational burden in cloud mode

---

## 10. Known Constraints

- GitHub Pages deployment serves static UI only; backend APIs are not hosted there
- In-browser Babel/UMD approach is convenient for demos but not optimal for enterprise frontend build pipelines

---

## 11. Recommended Next Steps

1. Introduce OpenAPI spec and generated API client
2. Add structured audit logging for admin actions
3. Add CI pipeline with lint/test/build gates
4. Migrate frontend to bundled build (Vite/React TS)
5. Add integration tests for auth and forecast endpoints
