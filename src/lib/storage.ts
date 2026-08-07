import type {
  ActivityEntry,
  Credential,
  DarRecord,
  Employee,
  RewardRecord,
  ServiceEvent,
  Session,
} from "./types";
import { seedData } from "./seed";

const PREFIX = "sbc-depot:";
export const KEYS = {
  employees: PREFIX + "employees",
  designations: PREFIX + "designations",
  batches: PREFIX + "batches",
  events: PREFIX + "events",
  dar: PREFIX + "dar",
  rewards: PREFIX + "rewards",
  activity: PREFIX + "activity",
  credentials: PREFIX + "credentials",
  darPassword: PREFIX + "dar-password",
  session: PREFIX + "session",
  seeded: PREFIX + "seeded-v1",
  employeeFilter: PREFIX + "employee-filter",
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

export function get<T>(key: Key, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function set<T>(key: Key, value: T): T {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("sbc-store-change", { detail: key }));
    } catch {
      /* quota */
    }
  }
  return value;
}

export function update<T>(key: Key, fallback: T, fn: (current: T) => T): T {
  return set(key, fn(get(key, fallback)));
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/* ---------- domain accessors ---------- */

export const store = {
  employees: () => get<Employee[]>(KEYS.employees, []),
  setEmployees: (v: Employee[]) => set(KEYS.employees, v),
  designations: () => get<string[]>(KEYS.designations, []),
  setDesignations: (v: string[]) => set(KEYS.designations, v),
  batches: () => get<string[]>(KEYS.batches, []),
  setBatches: (v: string[]) => set(KEYS.batches, v),
  events: () => get<ServiceEvent[]>(KEYS.events, []),
  setEvents: (v: ServiceEvent[]) => set(KEYS.events, v),
  dar: () => get<DarRecord[]>(KEYS.dar, []),
  setDar: (v: DarRecord[]) => set(KEYS.dar, v),
  rewards: () => get<RewardRecord[]>(KEYS.rewards, []),
  setRewards: (v: RewardRecord[]) => set(KEYS.rewards, v),
  activity: () => get<ActivityEntry[]>(KEYS.activity, []),
  credentials: () => get<Credential[]>(KEYS.credentials, []),
  darPassword: () => get<string>(KEYS.darPassword, "dar123"),
  session: () => get<Session | null>(KEYS.session, null),
  setSession: (v: Session | null) => set(KEYS.session, v),
};

export function logActivity(action: string, target: string) {
  const actor = store.session()?.name ?? "System";
  update<ActivityEntry[]>(KEYS.activity, [], (list) =>
    [
      { id: uid("act"), actor, action, target, timestamp: new Date().toISOString() },
      ...list,
    ].slice(0, 200),
  );
}

export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (get<boolean>(KEYS.seeded, false)) return;
  const data = seedData();
  set(KEYS.designations, data.designations);
  set(KEYS.batches, data.batches);
  set(KEYS.employees, data.employees);
  set(KEYS.events, data.events);
  set(KEYS.dar, data.dar);
  set(KEYS.rewards, data.rewards);
  set(KEYS.activity, data.activity);
  set(KEYS.credentials, data.credentials);
  set(KEYS.darPassword, "dar123");
  set(KEYS.seeded, true);
}
