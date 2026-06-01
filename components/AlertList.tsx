import { useEffect, useRef } from "react";
import { Alert } from "@/lib/types";
import AlertRow from "./AlertRow";
import styles from "./AlertList.module.css";

type Props = {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
};

export default function AlertList({ alerts, selectedId, onSelect, now }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-alert-id="${selectedId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  if (alerts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>No alerts match the current filters</div>
        <div className={styles.emptyHint}>Clear filters or adjust the search query.</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className={styles.list}>
      {alerts.map((a) => (
        <AlertRow
          key={a.id}
          alert={a}
          selected={a.id === selectedId}
          onSelect={onSelect}
          now={now}
        />
      ))}
    </div>
  );
}
