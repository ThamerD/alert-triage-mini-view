import { Alert, Severity } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";
import styles from "./AlertRow.module.css";

const SEVERITY_CLASS: Record<Severity, string> = {
  Critical: styles.barCritical,
  High: styles.barHigh,
  Medium: styles.barMedium,
  Low: styles.barLow,
};

function relativeTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  const diffMs = now - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Props = {
  alert: Alert;
  selected: boolean;
  onSelect: (id: string) => void;
  now: number;
};

export default function AlertRow({ alert, selected, onSelect, now }: Props) {
  return (
    <button
      type="button"
      className={`${styles.row} ${selected ? styles.selected : ""}`}
      onClick={() => onSelect(alert.id)}
      data-alert-id={alert.id}
    >
      <span className={`${styles.bar} ${SEVERITY_CLASS[alert.severity]}`} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.topRow}>
          <SeverityBadge severity={alert.severity} />
          <span className={styles.status}>{alert.status}</span>
          <span className={styles.source}>{alert.source}</span>
          <span className={styles.time}>{relativeTime(alert.createdAt, now)}</span>
        </div>
        <div className={styles.title}>{alert.title}</div>
        <div className={styles.meta}>
          <span className={styles.id}>{alert.id}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.entity}>{alert.entity}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.assignee}>
            {alert.assignee ?? "unassigned"}
          </span>
        </div>
      </div>
    </button>
  );
}
