"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, Status, CURRENT_USER } from "@/lib/types";
import { Filters, DEFAULT_FILTERS, filterAndSort } from "@/lib/filterAlerts";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import FilterBar from "@/components/FilterBar";
import AlertList from "@/components/AlertList";
import AlertDrawer from "@/components/AlertDrawer";
import HelpOverlay from "@/components/HelpOverlay";
import styles from "./page.module.css";

type Action =
  | { type: "LOAD"; alerts: Alert[] }
  | { type: "SET_STATUS"; id: string; status: Status }
  | { type: "ASSIGN_TO_ME"; id: string };

function alertsReducer(state: Alert[], action: Action): Alert[] {
  switch (action.type) {
    case "LOAD":
      return action.alerts;
    case "SET_STATUS":
      return state.map((a) => (a.id === action.id ? { ...a, status: action.status } : a));
    case "ASSIGN_TO_ME":
      return state.map((a) => (a.id === action.id ? { ...a, assignee: CURRENT_USER } : a));
    default:
      return state;
  }
}

export default function Page() {
  const [alerts, dispatch] = useReducer(alertsReducer, []);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/alerts.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Alert[]) => {
        if (cancelled) return;
        dispatch({ type: "LOAD", alerts: data });
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleAlerts = useMemo(() => filterAndSort(alerts, filters), [alerts, filters]);
  const selectedAlert = useMemo(
    () => (selectedId ? alerts.find((a) => a.id === selectedId) ?? null : null),
    [alerts, selectedId],
  );

  useKeyboardShortcuts({
    visibleAlerts,
    selectedId,
    onSelect: setSelectedId,
    onStatusChange: (id, status) => dispatch({ type: "SET_STATUS", id, status }),
    onCloseDrawer: () => setSelectedId(null),
    onToggleHelp: () => setHelpOpen((v) => !v),
    searchRef,
  });

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          Alert Triage
        </div>
        <button
          type="button"
          className={styles.helpBtn}
          onClick={() => setHelpOpen(true)}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      </header>

      <FilterBar
        ref={searchRef}
        filters={filters}
        onChange={setFilters}
        totalCount={alerts.length}
        visibleCount={visibleAlerts.length}
      />

      <main className={styles.main}>
        {loading ? (
          <div className={styles.status}>Loading alerts…</div>
        ) : loadError ? (
          <div className={styles.status}>Failed to load alerts: {loadError}</div>
        ) : (
          <AlertList
            alerts={visibleAlerts}
            selectedId={selectedId}
            onSelect={setSelectedId}
            now={now}
          />
        )}
      </main>

      <AlertDrawer
        alert={selectedAlert}
        onClose={() => setSelectedId(null)}
        onStatusChange={(id, status) => dispatch({ type: "SET_STATUS", id, status })}
        onAssignToMe={(id) => dispatch({ type: "ASSIGN_TO_ME", id })}
      />

      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
