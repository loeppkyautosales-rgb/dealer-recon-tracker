export function toMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function sanitizeStageElapsedMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value).reduce((acc, [status, duration]) => {
    const safeDuration = Number(duration);
    if (!status || !Number.isFinite(safeDuration) || safeDuration < 0) return acc;
    acc[status] = safeDuration;
    return acc;
  }, {});
}

export function getSavedStageElapsedMs(vehicle, status = vehicle?.status) {
  const stageElapsedMs = sanitizeStageElapsedMap(vehicle?.stageElapsedMs);
  return Number(stageElapsedMs[status]) || 0;
}

export function getCurrentStageElapsedMs(vehicle, now = Date.now()) {
  const savedStageElapsedMs = getSavedStageElapsedMs(vehicle, vehicle?.status);
  const stageEnteredAtMs = toMs(vehicle?.stageEnteredAt);
  if (!stageEnteredAtMs) return savedStageElapsedMs;
  return savedStageElapsedMs + Math.max(0, now - stageEnteredAtMs);
}

export function accumulateStageElapsed(vehicle, exitedAt = Date.now()) {
  const stageElapsedMs = sanitizeStageElapsedMap(vehicle?.stageElapsedMs);
  const currentStatus = vehicle?.status;
  if (!currentStatus) return stageElapsedMs;

  const stageEnteredAtMs = toMs(vehicle?.stageEnteredAt);
  if (!stageEnteredAtMs) return stageElapsedMs;

  return {
    ...stageElapsedMs,
    [currentStatus]: getSavedStageElapsedMs(vehicle, currentStatus) + Math.max(0, exitedAt - stageEnteredAtMs),
  };
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
