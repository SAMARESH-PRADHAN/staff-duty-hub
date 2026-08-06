import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureSeeded, store } from "@/lib/storage";
import type {
  ActivityEntry,
  DarRecord,
  Employee,
  RewardRecord,
  ServiceEvent,
  Session,
} from "@/lib/types";

export function useStoreVersion() {
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeeded();
    setReady(true);
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("sbc-store-change", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("sbc-store-change", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  return { version, ready, refresh: useCallback(() => setVersion((v) => v + 1), []) };
}

export interface AppData {
  ready: boolean;
  employees: Employee[];
  designations: string[];
  batches: string[];
  events: ServiceEvent[];
  dar: DarRecord[];
  rewards: RewardRecord[];
  activity: ActivityEntry[];
  darByEmployee: Record<string, number>;
  rewardsByEmployee: Record<string, number>;
  refresh: () => void;
}

export function useAppData(): AppData {
  const { version, ready, refresh } = useStoreVersion();

  return useMemo(() => {
    const employees = ready ? store.employees() : [];
    const dar = ready ? store.dar() : [];
    const rewards = ready ? store.rewards() : [];
    const count = (list: { employeeId: string }[]) =>
      list.reduce<Record<string, number>>((acc, r) => {
        acc[r.employeeId] = (acc[r.employeeId] ?? 0) + 1;
        return acc;
      }, {});
    return {
      ready,
      employees,
      designations: ready ? store.designations() : [],
      batches: ready ? store.batches() : [],
      events: ready ? store.events() : [],
      dar,
      rewards,
      activity: ready ? store.activity() : [],
      darByEmployee: count(dar),
      rewardsByEmployee: count(rewards),
      refresh,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ready, refresh]);
}

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ensureSeeded();
    setSessionState(store.session());
    setLoaded(true);
    const sync = () => setSessionState(store.session());
    window.addEventListener("sbc-store-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sbc-store-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, loaded };
}
