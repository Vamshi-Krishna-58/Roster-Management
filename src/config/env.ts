import "dotenv/config";

export interface AppConfig {
  appName: string;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: number;
  awsRegion?: string;
  dynamoTableName?: string;
  forecastTableName?: string;
  dynamoEndpoint?: string;
}

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_SECRET = "dev-only-change-me";
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 3600;
export const APP_NAME = "CoxRosterManagemnet";

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number.parseInt(rawPort, 10);
  if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return DEFAULT_PORT;
  }

  return parsedPort;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

export function getConfig(): AppConfig {
  return {
    appName: APP_NAME,
    port: parsePort(process.env.PORT),
    jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    jwtExpiresIn: parsePositiveInt(process.env.JWT_EXPIRES_IN_SECONDS, DEFAULT_JWT_EXPIRES_IN_SECONDS),
    awsRegion: process.env.AWS_REGION || undefined,
    dynamoTableName: process.env.DYNAMODB_TABLE_NAME || undefined,
    forecastTableName: process.env.FORECAST_TABLE_NAME || undefined,
    dynamoEndpoint: process.env.DYNAMODB_ENDPOINT || undefined
  };
}
