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

export interface SavedEmployeeFilter {
  search: string;
  designation: string;
  batch: string;
  gender: string;
  status: string;
  ageMin: string;
  ageMax: string;
}

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
  employeeFilter: () => get<SavedEmployeeFilter | null>(KEYS.employeeFilter, null),
  setEmployeeFilter: (v: SavedEmployeeFilter | null) => set(KEYS.employeeFilter, v),
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

/* ---------- backup & restore ---------- */

const BACKUP_KEYS = [
  KEYS.employees,
  KEYS.designations,
  KEYS.batches,
  KEYS.events,
  KEYS.dar,
  KEYS.rewards,
  KEYS.activity,
  KEYS.credentials,
  KEYS.darPassword,
  KEYS.employeeFilter,
] as const;

export function backupData(): string {
  const payload: Record<string, unknown> = {};
  BACKUP_KEYS.forEach((k) => {
    payload[k] = get<unknown>(k, null);
  });
  const blob = new Blob(
    [JSON.stringify({ app: "sbc-depot", version: 1, savedAt: new Date().toISOString(), data: payload }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `sbc-depot-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logActivity("Data backup downloaded", a.download);
  return a.download;
}

export async function restoreData(file: File): Promise<number> {
  const text = await file.text();
  const parsed = JSON.parse(text) as { app?: string; data?: Record<string, unknown> };
  if (parsed.app !== "sbc-depot" || !parsed.data)
    throw new Error("This file is not a valid SBC Depot backup.");
  let restored = 0;
  BACKUP_KEYS.forEach((k) => {
    const value = parsed.data?.[k];
    if (value !== undefined && value !== null) {
      set(k, value);
      restored += 1;
    }
  });
  set(KEYS.seeded, true);
  logActivity("Data restored from backup", file.name);
  return restored;
}

/* ---------- seeding & migration ---------- */

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

function emailFor(name: string, token: string) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  return `${slug || token.toLowerCase()}@sbcdepot.railnet.in`;
}

function migrate() {
  const employees = store.employees();
  if (employees.length === 0) return;
  let changed = false;
  const next = employees.map((e, i) => {
    if (e.email && e.bloodGroup) return e;
    changed = true;
    return {
      ...e,
      email: e.email || emailFor(e.name, e.tokenNo),
      bloodGroup: e.bloodGroup || BLOOD_GROUPS[i % BLOOD_GROUPS.length]!,
    };
  });
  if (changed) set(KEYS.employees, next);
}

export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (get<boolean>(KEYS.seeded, false)) {
    migrate();
    return;
  }
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
  migrate();
}
