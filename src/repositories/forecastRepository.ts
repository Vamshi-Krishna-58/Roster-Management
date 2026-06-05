import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import type { CountryConfig, ForecastEntry } from "../domain/forecast";
import { DEFAULT_COUNTRY_CONFIGS } from "../domain/forecast";

export class ForecastRepository {
  private readonly forecasts = new Map<string, ForecastEntry>();
  private readonly countryConfigs = new Map<string, CountryConfig>();

  private readonly documentClient?: DynamoDBDocumentClient;
  private useInMemoryFallback = false;

  public constructor(
    private readonly forecastTableName?: string,
    dynamoRegion?: string,
    dynamoEndpoint?: string
  ) {
    if (this.forecastTableName && dynamoRegion) {
      const client = new DynamoDBClient({
        region: dynamoRegion,
        endpoint: dynamoEndpoint || undefined
      });
      this.documentClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: { removeUndefinedValues: true }
      });
    }

    for (const config of DEFAULT_COUNTRY_CONFIGS) {
      this.countryConfigs.set(config.countryCode.toUpperCase(), config);
    }
  }

  public getCountryConfig(countryCode: string): CountryConfig | undefined {
    return this.countryConfigs.get(countryCode.toUpperCase());
  }

  public getAllCountryConfigs(): CountryConfig[] {
    return [...this.countryConfigs.values()];
  }

  public async getForecasts(employeeId: string): Promise<ForecastEntry[]> {
    if (!this.documentClient || !this.forecastTableName || this.useInMemoryFallback) {
      return [...this.forecasts.values()].filter((f) => f.employeeId === employeeId);
    }

    const response = await this.documentClient
      .send(
        new QueryCommand({
          TableName: this.forecastTableName,
          KeyConditionExpression: "employeeId = :eid",
          ExpressionAttributeValues: { ":eid": employeeId }
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          return { Items: [...this.forecasts.values()].filter((f) => f.employeeId === employeeId) };
        }
        throw error;
      });

    return (response.Items ?? []) as ForecastEntry[];
  }

  public async saveForecast(entry: ForecastEntry): Promise<ForecastEntry> {
    const key = `${entry.employeeId}#${entry.forecastMonth}`;

    if (!this.documentClient || !this.forecastTableName || this.useInMemoryFallback) {
      this.forecasts.set(key, entry);
      return entry;
    }

    await this.documentClient
      .send(
        new PutCommand({
          TableName: this.forecastTableName,
          Item: entry
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          this.forecasts.set(key, entry);
          return;
        }
        throw error;
      });

    return entry;
  }

  public async getAllForecasts(): Promise<ForecastEntry[]> {
    if (!this.documentClient || !this.forecastTableName || this.useInMemoryFallback) {
      return [...this.forecasts.values()];
    }

    const response = await this.documentClient
      .send(
        new ScanCommand({
          TableName: this.forecastTableName
        })
      )
      .catch((error: unknown) => {
        if (this.isDynamoCredentialError(error)) {
          this.useInMemoryFallback = true;
          return { Items: [...this.forecasts.values()] };
        }
        throw error;
      });

    return (response.Items ?? []) as ForecastEntry[];
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
