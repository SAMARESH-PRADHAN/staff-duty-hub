/**
 * Retirement date utility — FR 56 rule.
 * Retirement = last day of the month in which the employee turns 60,
 * except when DOB is the 1st of a month, where it is the last day of the
 * previous month.
 *   DOB 01-May-1990 -> 30-Apr-2050
 *   DOB 03-May-1990 -> 31-May-2050
 */
export function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function lastDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}

export function calcRetirementDate(dobISO: string): Date | null {
  const dob = parseISODate(dobISO);
  if (!dob) return null;
  const y = dob.getUTCFullYear() + 60;
  const m = dob.getUTCMonth();
  const day = dob.getUTCDate();
  return day === 1 ? lastDayOfMonth(y, m - 1) : lastDayOfMonth(y, m);
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = parseISODate(iso);
  if (!d) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")}-${d.toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  })}-${d.getUTCFullYear()}`;
}

export function calcAge(dobISO: string, at: Date = new Date()): number {
  const dob = parseISODate(dobISO);
  if (!dob) return 0;
  let age = at.getUTCFullYear() - dob.getUTCFullYear();
  const m = at.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

export function maskValue(value: string, visible = 4): string {
  if (!value) return "—";
  const tail = value.slice(-visible);
  return "•".repeat(Math.max(0, value.length - visible)) + tail;
}
