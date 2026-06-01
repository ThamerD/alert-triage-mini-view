import { forwardRef } from "react";
import {
  SEVERITIES,
  STATUSES,
  SOURCES,
  Severity,
  Status,
  Source,
} from "@/lib/types";
import { Filters, SortKey, SortDir } from "@/lib/filterAlerts";
import styles from "./FilterBar.module.css";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  totalCount: number;
  visibleCount: number;
};

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

const FilterBar = forwardRef<HTMLInputElement, Props>(function FilterBar(
  { filters, onChange, totalCount, visibleCount },
  searchRef,
) {
  const setSearch = (search: string) => onChange({ ...filters, search });
  const setSev = (s: Severity) => onChange({ ...filters, severities: toggle(filters.severities, s) });
  const setStat = (s: Status) => onChange({ ...filters, statuses: toggle(filters.statuses, s) });
  const setSrc = (s: Source) => onChange({ ...filters, sources: toggle(filters.sources, s) });
  const setSortKey = (sortKey: SortKey) => onChange({ ...filters, sortKey });
  const setSortDir = (sortDir: SortDir) => onChange({ ...filters, sortDir });

  const anyActive =
    filters.search ||
    filters.severities.length ||
    filters.statuses.length ||
    filters.sources.length;

  return (
    <div className={styles.bar}>
      <div className={styles.topRow}>
        <input
          ref={searchRef}
          type="text"
          className={styles.search}
          placeholder="Search id, title, entity, assignee, description..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>Sort</span>
          <select
            className={styles.select}
            value={filters.sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="createdAt">Created</option>
            <option value="severity">Severity</option>
            <option value="status">Status</option>
          </select>
          <button
            type="button"
            className={styles.dirBtn}
            onClick={() => setSortDir(filters.sortDir === "asc" ? "desc" : "asc")}
            title={filters.sortDir === "asc" ? "Ascending" : "Descending"}
          >
            {filters.sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <div className={styles.count}>
          {visibleCount} / {totalCount}
        </div>
      </div>

      <div className={styles.chipRows}>
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>Severity</span>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.chip} ${filters.severities.includes(s) ? styles.chipActive : ""}`}
              onClick={() => setSev(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>Status</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.chip} ${filters.statuses.includes(s) ? styles.chipActive : ""}`}
              onClick={() => setStat(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>Source</span>
          {SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.chip} ${filters.sources.includes(s) ? styles.chipActive : ""}`}
              onClick={() => setSrc(s)}
            >
              {s}
            </button>
          ))}
          {anyActive ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() =>
                onChange({
                  ...filters,
                  search: "",
                  severities: [],
                  statuses: [],
                  sources: [],
                })
              }
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default FilterBar;
