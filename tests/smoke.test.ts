import request from "supertest";
import { describe, expect, it } from "vitest";
import { APP_NAME, createApp } from "../src/index";

process.env.AWS_REGION = "";
process.env.DYNAMODB_TABLE_NAME = "";
process.env.DYNAMODB_ENDPOINT = "";

async function loginAs(app: ReturnType<typeof createApp>, username: string, password: string): Promise<string> {
  const response = await request(app).post("/api/v1/auth/login").send({ username, password });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe("API smoke tests", () => {
  it("returns 200 from /health", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: APP_NAME });
  });

  it("returns 401 from /api/v1/employees without token", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/employees");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid or expired token" });
  });

  it("allows viewer to list employees", async () => {
    const app = createApp();
    const token = await loginAs(app, "viewer", "viewer123");
    const response = await request(app).get("/api/v1/employees").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });

  it("forbids viewer from creating employees", async () => {
    const app = createApp();
    const token = await loginAs(app, "viewer", "viewer123");
    const response = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Ava",
        lastName: "Stone",
        email: "ava@cox.com",
        location: "Atlanta",
        department: "Engineering",
        team: "Infrastructure",
        teamLead: "Jordan Lee",
        releaseTrain: "Atlas",
        coxManager: "Jordan Lee",
        startDate: "2026-04-01",
        endDate: null,
        billRateUsd: "95",
        workLocation: "onshore",
        billingType: "billable",
        status: "active",
        skills: "Python, AWS, Docker"
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
  });

  it("allows scheduler to create and update employees", async () => {
    const app = createApp();
    const token = await loginAs(app, "scheduler", "scheduler123");
    const createResponse = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Weekday",
        lastName: "Rotation",
        email: "weekday@cox.com",
        location: "Dallas",
        department: "Operations",
        team: "Logistics",
        teamLead: "Dana Cole",
        releaseTrain: "Mercury",
        coxManager: "Dana Cole",
        startDate: "2026-03-31",
        endDate: null,
        billRateUsd: "88",
        workLocation: "offshore",
        billingType: "billable",
        status: "active",
        skills: "Supply Chain, SAP, Analytics"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.item.firstName).toBe("Weekday");
    expect(createResponse.body.item.lastName).toBe("Rotation");
    expect(createResponse.body.item.employeeId).toBeDefined();
    expect(createResponse.body.item.email).toBe("weekday@cox.com");
    expect(createResponse.body.item.billRateUsd).toBe("88");

    const updateResponse = await request(app)
      .patch(`/api/v1/employees/${createResponse.body.item.employeeId as string}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        endDate: "2026-06-30",
        billingType: "non-billable",
        status: "rolled-off"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.item.endDate).toBe("2026-06-30");
    expect(updateResponse.body.item.billingType).toBe("non-billable");
    expect(updateResponse.body.item.status).toBe("rolled-off");

    const listResponse = await request(app).get("/api/v1/employees").set("Authorization", `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].endDate).toBe("2026-06-30");
  });

  it("serves the frontend entry page", async () => {
    const app = createApp();
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Cox Mega Roster Portal");
  });

  it("rejects invalid login", async () => {
    const app = createApp();
    const response = await request(app).post("/api/v1/auth/login").send({ username: "viewer", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp();
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Route not found" });
  });
});
