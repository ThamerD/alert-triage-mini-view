export type Severity = "Critical" | "High" | "Medium" | "Low";

export type Status =
  | "New"
  | "In Progress"
  | "Escalated"
  | "Resolved"
  | "Suppressed";

export type Source =
  | "EDR"
  | "SIEM"
  | "IDS"
  | "Email Gateway"
  | "Cloud Audit"
  | "Identity";

export type Alert = {
  id: string;
  title: string;
  severity: Severity;
  status: Status;
  source: Source;
  createdAt: string;
  assignee: string | null;
  description: string;
  entity: string;
};

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
export const STATUSES: Status[] = [
  "New",
  "In Progress",
  "Escalated",
  "Resolved",
  "Suppressed",
];
export const SOURCES: Source[] = [
  "EDR",
  "SIEM",
  "IDS",
  "Email Gateway",
  "Cloud Audit",
  "Identity",
];

export const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const STATUS_RANK: Record<Status, number> = {
  New: 0,
  "In Progress": 1,
  Escalated: 2,
  Resolved: 3,
  Suppressed: 4,
};

export const CURRENT_USER = "t.azim@corp.com";
