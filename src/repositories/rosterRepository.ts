import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import type { CreateEmployeeInput, EmployeeRecord, UpdateEmployeeInput } from "../domain/roster";
import { AppError } from "../errors/AppError";

export class RosterRepository {
  private readonly items = new Map<string, EmployeeRecord>();

  private readonly documentClient?: DynamoDBDocumentClient;

  private useInMemoryFallback = false;

  public constructor(
    private readonly dynamoTableName?: string,
    dynamoRegion?: string,
    dynamoEndpoint?: string
  ) {
    if (this.dynamoTableName && dynamoRegion) {
      const client = new DynamoDBClient({
        region: dynamoRegion,
        endpoint: dynamoEndpoint || undefined
      });
      this.documentClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          removeUndefinedValues: true
        }
      });
    }
  }

  public async listEmployees(): Promise<EmployeeRecord[]> {
    if (!this.documentClient || !this.dynamoTableName || this.useInMemoryFallback) {
      return [...this.items.values()].sort((left, right) => {
        const leftName = `${left.firstName} ${left.lastName}`;
        const rightName = `${right.firstName} ${right.lastName}`;
        return leftName.localeCompare(rightName);
      });
    }

    const response = await this.documentClient
      .send(
        new ScanCommand({
          TableName: this.dynamoTableName
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          return { Items: [...this.items.values()] };
        }

        throw error;
      });

    const items = (response.Items ?? []) as EmployeeRecord[];
    return items.sort((left, right) => {
      const leftName = `${left.firstName} ${left.lastName}`;
      const rightName = `${right.firstName} ${right.lastName}`;
      return leftName.localeCompare(rightName);
    });
  }

  public async createEmployee(input: CreateEmployeeInput): Promise<EmployeeRecord> {
    const timestamp = new Date().toISOString();
    const employee: EmployeeRecord = {
      employeeId: randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      location: input.location,
      department: input.department,
      releaseTrain: input.releaseTrain,
      startDate: input.startDate,
      endDate: input.endDate,
      coxManager: input.coxManager,
      billingType: input.billingType,
      status: input.status,
      email: input.email,
      team: input.team,
      teamLead: input.teamLead,
      billRateUsd: input.billRateUsd,
      workLocation: input.workLocation,
      skills: input.skills,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (!this.documentClient || !this.dynamoTableName || this.useInMemoryFallback) {
      this.items.set(employee.employeeId, employee);
      return employee;
    }

    await this.documentClient
      .send(
        new PutCommand({
          TableName: this.dynamoTableName,
          Item: employee
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          this.items.set(employee.employeeId, employee);
          return;
        }

        throw error;
      });

    return employee;
  }

  public async updateEmployee(employeeId: string, input: UpdateEmployeeInput): Promise<EmployeeRecord> {
    if (!this.documentClient || !this.dynamoTableName || this.useInMemoryFallback) {
      const currentEmployee = this.items.get(employeeId);
      if (!currentEmployee) {
        throw new AppError("Employee not found", 404);
      }

      const employee: EmployeeRecord = {
        ...currentEmployee,
        ...input,
        updatedAt: new Date().toISOString()
      };

      this.items.set(employeeId, employee);
      return employee;
    }

    const attributeEntries = Object.entries(input).filter(([, value]) => value !== undefined);
    if (attributeEntries.length === 0) {
      throw new AppError("At least one employee field must be provided for update", 400);
    }

    const updatedAt = new Date().toISOString();
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt"
    };
    const expressionAttributeValues: Record<string, string | null> = {
      ":updatedAt": updatedAt
    };
    const updateExpressions = ["#updatedAt = :updatedAt"];

    for (const [field, value] of attributeEntries) {
      const nameKey = `#${field}`;
      const valueKey = `:${field}`;
      expressionAttributeNames[nameKey] = field;
      expressionAttributeValues[valueKey] = value;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
    }

    const response = await this.documentClient
      .send(
        new UpdateCommand({
          TableName: this.dynamoTableName,
          Key: { employeeId },
          ConditionExpression: "attribute_exists(employeeId)",
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW"
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          const currentEmployee = this.items.get(employeeId);
          if (!currentEmployee) {
            throw new AppError("Employee not found", 404);
          }

          const employee: EmployeeRecord = {
            ...currentEmployee,
            ...input,
            updatedAt: new Date().toISOString()
          };

          this.items.set(employeeId, employee);
          return { Attributes: employee };
        }

        if (typeof error === "object" && error && "name" in error && error.name === "ConditionalCheckFailedException") {
          throw new AppError("Employee not found", 404);
        }

        throw error;
      });

    return response.Attributes as EmployeeRecord;
  }

  private isDynamoCredentialError(error: unknown): boolean {
    if (typeof error !== "object" || error === null || !("name" in error)) {
      return false;
    }

    const name = String(error.name);
    return (
      name === "CredentialsProviderError" ||
      name === "UnrecognizedClientException" ||
      name === "AccessDeniedException" ||
      name === "ResourceNotFoundException"
    );
  }
}
