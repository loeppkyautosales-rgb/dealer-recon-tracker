export function toMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function formatWeeksDaysHours(durationMs) {
  const safe = Math.max(0, durationMs || 0);
  const totalHours = Math.floor(safe / (60 * 60 * 1000));
  const weeks = Math.floor(totalHours / (24 * 7));
  const days = Math.floor((totalHours % (24 * 7)) / 24);
  const hours = totalHours % 24;

  const parts = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks === 1 ? '' : 's'}`);
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0 || parts.length === 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function formatDaysHours(durationMs) {
  const safe = Math.max(0, durationMs || 0);
  const totalHours = Math.floor(safe / (60 * 60 * 1000));
  const totalMinutes = Math.floor(safe / (60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days < 1) {
    if (hours < 1) {
      return `${minutes} min${minutes === 1 ? '' : 's'}`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'}, ${minutes} min${minutes === 1 ? '' : 's'}`;
  }

  return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}, ${minutes} min${minutes === 1 ? '' : 's'}`;
}
