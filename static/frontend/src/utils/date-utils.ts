/**
 * Get the ISO date string (YYYY-MM-DD) for a Date.
 */
export function toISODate(date: Date): string {
  return date.toISOString().substring(0, 10);
}

/**
 * Get the start (Monday) and end (Sunday) of the week containing the given date.
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so Monday = 0
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get the start and end of the month containing the given date.
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

/**
 * Generate an array of ISO date strings for each day in a range.
 */
export function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (current <= end) {
    days.push(toISODate(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Format a date for display: "Mon 19" or "Feb 19".
 */
export function formatDayShort(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

/**
 * Format a date range for display: "Feb 17 - Feb 23, 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const startStr = `${months[start.getMonth()]} ${start.getDate()}`;
  const endStr = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

  return `${startStr} - ${endStr}`;
}

/**
 * Navigate weeks: returns a new date shifted by the given number of weeks.
 */
export function shiftWeek(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/**
 * Navigate days: returns a new date shifted by the given number of days.
 */
export function shiftDay(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if a date string represents today.
 */
export function isToday(isoDate: string): boolean {
  return isoDate === toISODate(new Date());
}

/**
 * Check if a date string represents a weekend (Saturday or Sunday).
 */
export function isWeekend(isoDate: string): boolean {
  const day = new Date(isoDate + "T00:00:00").getDay();
  return day === 0 || day === 6;
}
