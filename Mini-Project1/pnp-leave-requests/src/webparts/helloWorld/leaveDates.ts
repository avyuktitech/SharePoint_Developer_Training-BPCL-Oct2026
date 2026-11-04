// Leave dates are calendar days, not moments in time, so they are kept as 'YYYY-MM-DD' strings
// everywhere. A Date would shift by a day for users whose time zone differs from the site's.
const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

// Monday to Friday between start and end, both included. Public holidays are not considered.
export function workingDays(start: string, end: string): number {
  let count = 0;
  for (let ms = toUtcMs(start); ms <= toUtcMs(end); ms += DAY_MS) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}

export function nextDay(date: string): string {
  return new Date(toUtcMs(date) + DAY_MS).toISOString().slice(0, 10);
}

// ISO dates sort alphabetically in date order, so plain string comparison is enough.
export function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && startB <= endA;
}
