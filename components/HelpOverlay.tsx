import styles from "./HelpOverlay.module.css";

type Props = { open: boolean; onClose: () => void };

const SHORTCUTS: [string, string][] = [
  ["j / k", "Next / previous alert"],
  ["1 - 5", "Set status: New / In Progress / Escalated / Resolved / Suppressed"],
  ["/", "Focus search"],
  ["Esc", "Close drawer or blur search"],
  ["?", "Toggle this help"],
];

export default function HelpOverlay({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Keyboard shortcuts</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <table className={styles.table}>
          <tbody>
            {SHORTCUTS.map(([keys, desc]) => (
              <tr key={keys}>
                <td className={styles.keys}>
                  {keys.split(" ").map((k, i) =>
                    k === "/" || k === "-" ? (
                      <span key={i} className={styles.sep}>{k}</span>
                    ) : (
                      <kbd key={i}>{k}</kbd>
                    ),
                  )}
                </td>
                <td className={styles.desc}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
