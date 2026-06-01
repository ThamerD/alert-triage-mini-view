import { Alert, Status, STATUSES, CURRENT_USER } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";
import styles from "./AlertDrawer.module.css";

type Props = {
  alert: Alert | null;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
  onAssignToMe: (id: string) => void;
};

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function AlertDrawer({
  alert,
  onClose,
  onStatusChange,
  onAssignToMe,
}: Props) {
  const open = alert !== null;
  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}>
        {alert ? (
          <>
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={styles.id}>{alert.id}</span>
                <SeverityBadge severity={alert.severity} />
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                title="Close (Esc)"
              >
                ×
              </button>
            </header>

            <h2 className={styles.title}>{alert.title}</h2>

            <section className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Status</span>
                <select
                  className={styles.statusSelect}
                  value={alert.status}
                  onChange={(e) => onStatusChange(alert.id, e.target.value as Status)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Source</span>
                <span className={styles.fieldValue}>{alert.source}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Entity</span>
                <span className={styles.fieldValueMono}>{alert.entity}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Created</span>
                <span className={styles.fieldValue}>{formatAbsolute(alert.createdAt)}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Assignee</span>
                <span className={styles.assigneeRow}>
                  <span className={styles.fieldValue}>
                    {alert.assignee ?? <em className={styles.unassigned}>unassigned</em>}
                  </span>
                  {alert.assignee !== CURRENT_USER && (
                    <button
                      type="button"
                      className={styles.assignBtn}
                      onClick={() => onAssignToMe(alert.id)}
                    >
                      Assign to me
                    </button>
                  )}
                </span>
              </div>
            </section>

            <section className={styles.descriptionSection}>
              <div className={styles.fieldLabel}>Description</div>
              <p className={styles.description}>{alert.description}</p>
            </section>

            <footer className={styles.footer}>
              <span className={styles.footerHint}>
                Shortcuts: <kbd>1</kbd>-<kbd>5</kbd> set status · <kbd>Esc</kbd> close
              </span>
            </footer>
          </>
        ) : null}
      </aside>
    </>
  );
}
