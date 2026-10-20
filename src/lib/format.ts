// Pure helpers over JSON Resume data. Kept free of Astro/React imports so `npm test` can run them directly.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** JSON Resume dates are ISO-8601 prefixes: "2025", "2025-04" or "2025-04-12". */
function parse(date: string): { y: number; m: number } {
  const [y, m = '1'] = date.split('-');
  return { y: Number(y), m: Number(m) };
}

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(date?: string): string {
  if (!date) return 'Present';
  const { y, m } = parse(date);
  return date.length >= 7 ? `${MONTHS[m - 1]} ${y}` : String(y);
}

export function dateRange(start?: string, end?: string): string {
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** Inclusive month count, so Apr→Apr is 1 month. */
export function monthsBetween(start: string, end: string): number {
  const a = parse(start);
  const b = parse(end);
  return (b.y - a.y) * 12 + (b.m - a.m) + 1;
}

export function durationLabel(start?: string, end?: string, now = new Date()): string {
  if (!start) return '';
  const total = monthsBetween(start, end ?? currentMonth(now));
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}

export function yearsSince(dates: (string | undefined)[], now = new Date()): number {
  const first = dates.filter(Boolean).sort()[0];
  return first ? Math.floor((monthsBetween(first, currentMonth(now)) - 1) / 12) : 0;
}

/** "Project – Organisation" → "Organisation". */
export function orgName(name: string): string {
  return name.split(' – ').at(-1)!.trim();
}

/** "Project – Organisation" → "Project", or undefined when there is no project part. */
export function projectName(name: string): string | undefined {
  const parts = name.split(' – ');
  return parts.length > 1 ? parts.slice(0, -1).join(' – ').trim() : undefined;
}

/** "Jane Doe – Lead Engineer" → { name, role } */
export function splitNameRole(value: string): { name: string; role?: string } {
  const [name, ...role] = value.split(' – ');
  return { name: name.trim(), role: role.join(' – ').trim() || undefined };
}

/** Open to work when no role is ongoing and the latest one has already ended. */
export function isAvailable(work: { endDate?: string }[], now = new Date()): boolean {
  if (work.length === 0 || work.some((w) => !w.endDate)) return false;
  const latest = work.map((w) => w.endDate!).sort().at(-1)!;
  return latest.slice(0, 7) < currentMonth(now);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a matcher for a skill keyword. "Google Cloud Platform (GCP)" also matches "GCP";
 * "Agile / Scrum" matches either side.
 */
export function keywordMatcher(keyword: string): RegExp {
  const alias = keyword.match(/\(([^)]+)\)/)?.[1];
  const base = keyword.replace(/\s*\([^)]*\)/, '');
  const terms = [base, alias, ...base.split(' / ')].filter((t): t is string => !!t && t.length > 1);
  // Lookarounds instead of \b so terms like "Node.js" and "CI/CD" still match at their edges.
  return new RegExp(`(?<![\\w.])(?:${[...new Set(terms)].map(escape).join('|')})(?![\\w])`, 'i');
}

/** "Google Cloud Platform (GCP)" → "Google Cloud Platform" for compact chips. */
export const shortTag = (t: string) => t.replace(/\s*\([^)]*\)/, '');

/** Which of `keywords` appear in `text`, in keyword order. */
export function matchKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((k) => keywordMatcher(k).test(text));
}
