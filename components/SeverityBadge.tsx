import { Severity } from "@/lib/types";
import styles from "./SeverityBadge.module.css";

const CLASS: Record<Severity, string> = {
  Critical: styles.critical,
  High: styles.high,
  Medium: styles.medium,
  Low: styles.low,
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`${styles.badge} ${CLASS[severity]}`}>{severity}</span>;
}
