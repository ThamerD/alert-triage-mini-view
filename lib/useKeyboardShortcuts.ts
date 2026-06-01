import { useEffect, RefObject } from "react";
import { Alert, Status, STATUSES } from "./types";

type Args = {
  visibleAlerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  onCloseDrawer: () => void;
  onToggleHelp: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function useKeyboardShortcuts({
  visibleAlerts,
  selectedId,
  onSelect,
  onStatusChange,
  onCloseDrawer,
  onToggleHelp,
  searchRef,
}: Args) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const typing = isTypingTarget(e.target);

      if (e.key === "Escape") {
        if (typing && e.target instanceof HTMLElement) {
          e.target.blur();
          return;
        }
        onCloseDrawer();
        return;
      }

      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (e.key === "j" || e.key === "k") {
        if (visibleAlerts.length === 0) return;
        const idx = selectedId
          ? visibleAlerts.findIndex((a) => a.id === selectedId)
          : -1;
        let nextIdx: number;
        if (e.key === "j") {
          nextIdx = idx < 0 ? 0 : Math.min(idx + 1, visibleAlerts.length - 1);
        } else {
          nextIdx = idx < 0 ? 0 : Math.max(idx - 1, 0);
        }
        e.preventDefault();
        onSelect(visibleAlerts[nextIdx].id);
        return;
      }

      if (selectedId && /^[1-5]$/.test(e.key)) {
        const status = STATUSES[Number(e.key) - 1];
        if (status) {
          e.preventDefault();
          onStatusChange(selectedId, status);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleAlerts, selectedId, onSelect, onStatusChange, onCloseDrawer, onToggleHelp, searchRef]);
}
