export type BillingType = "billable" | "non-billable";

export type EmployeeStatus = "active" | "rolled-off";

export interface EmployeeRecord {
  employeeId: string;
  firstName: string;
  lastName: string;
  location: string;
  department: string;
  releaseTrain: string;
  startDate: string;
  endDate: string | null;
  coxManager: string;
  billingType: BillingType;
  status: EmployeeStatus;
  email: string;
  team: string;
  teamLead: string;
  billRateUsd: string;
  workLocation: "onshore" | "offshore";
  skills: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  location: string;
  department: string;
  releaseTrain: string;
  startDate: string;
  endDate: string | null;
  coxManager: string;
  billingType: BillingType;
  status: EmployeeStatus;
  email: string;
  team: string;
  teamLead: string;
  billRateUsd: string;
  workLocation: "onshore" | "offshore";
  skills: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  location?: string;
  department?: string;
  releaseTrain?: string;
  startDate?: string;
  endDate?: string | null;
  coxManager?: string;
  billingType?: BillingType;
  status?: EmployeeStatus;
  email?: string;
  team?: string;
  teamLead?: string;
  billRateUsd?: string;
  workLocation?: "onshore" | "offshore";
  skills?: string;
}
