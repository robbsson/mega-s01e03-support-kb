// What #4471 really holds: one problem per thing a fix has to change. causes.ts tells the two date
// flips apart by tenant; the desk's one-day notes (desk-notes.json) are reports where nothing flipped.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

// A report the desk read as a one-day move is not a month flip, whatever its tenant.
export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // Reports intake tagged with another cause than the one they belong to.
  mistagged: number;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  return PROBLEMS.map((problem) => {
    const rs = merged.filter((r) => problemOf(r, tenantOf(r), oneDay) === problem);
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      reports: rs,
      tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
      channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
      mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    };
  }).filter((g) => g.reports.length > 0);
}
