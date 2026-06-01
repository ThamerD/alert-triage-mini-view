import {
  Alert,
  Severity,
  Status,
  Source,
  SEVERITY_RANK,
  STATUS_RANK,
} from "./types";

export type SortKey = "createdAt" | "severity" | "status";
export type SortDir = "asc" | "desc";

export type Filters = {
  search: string;
  severities: Severity[];
  statuses: Status[];
  sources: Source[];
  sortKey: SortKey;
  sortDir: SortDir;
};

export const DEFAULT_FILTERS: Filters = {
  search: "",
  severities: [],
  statuses: [],
  sources: [],
  sortKey: "createdAt",
  sortDir: "desc",
};

export function filterAndSort(alerts: Alert[], filters: Filters): Alert[] {
  const q = filters.search.trim().toLowerCase();
  const filtered = alerts.filter((a) => {
    if (filters.severities.length && !filters.severities.includes(a.severity)) return false;
    if (filters.statuses.length && !filters.statuses.includes(a.status)) return false;
    if (filters.sources.length && !filters.sources.includes(a.source)) return false;
    if (q) {
      const hay =
        a.id.toLowerCase() +
        " " +
        a.title.toLowerCase() +
        " " +
        (a.assignee ?? "").toLowerCase() +
        " " +
        a.entity.toLowerCase() +
        " " +
        a.description.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const dir = filters.sortDir === "asc" ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sortKey) {
      case "severity":
        return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * dir;
      case "status":
        return (STATUS_RANK[a.status] - STATUS_RANK[b.status]) * dir;
      case "createdAt":
      default:
        return (a.createdAt.localeCompare(b.createdAt)) * dir;
    }
  });

  return sorted;
}
