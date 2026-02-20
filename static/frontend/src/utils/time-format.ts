/**
 * Format seconds to a human-readable string like "2h 30m".
 */
export function formatTime(seconds: number): string {
  if (seconds === 0) return "0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}

/**
 * Format seconds to a decimal hours string like "2.5h".
 */
export function formatDecimalHours(seconds: number): string {
  if (seconds === 0) return "0h";
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
}

/**
 * Parse a time string like "2h 30m" or "1.5h" into seconds.
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try decimal hours: "2.5h" or "2.5"
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h?$/i);
  if (decimalMatch) {
    return Math.round(parseFloat(decimalMatch[1]) * 3600);
  }

  // Try "Xh Ym" format
  let totalSeconds = 0;
  const hourMatch = trimmed.match(/(\d+)\s*h/i);
  const minMatch = trimmed.match(/(\d+)\s*m/i);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;

  if (totalSeconds > 0) return totalSeconds;

  // Try plain minutes: "30m" or just a number treated as minutes
  const plainNum = trimmed.match(/^(\d+)$/);
  if (plainNum) {
    return parseInt(plainNum[1], 10) * 60;
  }

  return null;
}
