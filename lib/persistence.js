export const STORAGE_KEYS = {
  vehicles: 'dealer-recon:vehicles',
  auditEvents: 'dealer-recon:auditEvents',
  users: 'dealer-recon:users',
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function isClient() {
  return typeof window !== 'undefined';
}

export function loadVehicles() {
  if (!isClient()) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEYS.vehicles), []);
}

export function saveVehicles(vehicles) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles || []));
}

export function loadAuditEvents() {
  if (!isClient()) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEYS.auditEvents), []);
}

export function saveAuditEvents(events) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.auditEvents, JSON.stringify(events || []));
}

export function appendAuditEvent(entry) {
  if (!isClient()) return;
  const existing = loadAuditEvents();
  const next = [entry, ...existing];
  saveAuditEvents(next);
  return next;
}

export function loadUsers(defaultUsers = []) {
  if (!isClient()) return defaultUsers;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEYS.users), null);
  return Array.isArray(stored) && stored.length ? stored : defaultUsers;
}

export function saveUsers(users) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users || []));
}
