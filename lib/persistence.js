export const STORAGE_KEYS = {
  vehicles: 'dealer-recon:vehicles',
  auditEvents: 'dealer-recon:auditEvents',
  auditPrunedAt: 'dealer-recon:auditPrunedAt',
  stageSlaHours: 'dealer-recon:stageSlaHours',
  users: 'dealer-recon:users',
  localAuthUsers: 'dealer-recon:local-auth-users',
  localSession: 'dealer-recon:local-session',
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

const AUDIT_RETENTION_DAYS = 60;

function pruneOldEntries(entries) {
  const cutoff = Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return (entries || []).filter((e) => new Date(e.time).getTime() >= cutoff);
}

function setAuditPrunedAt(timestamp) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.auditPrunedAt, timestamp);
}

export function loadAuditLastPruned() {
  if (!isClient()) return null;
  return window.localStorage.getItem(STORAGE_KEYS.auditPrunedAt);
}

export function saveAuditEvents(events) {
  if (!isClient()) return;
  const pruned = pruneOldEntries(events);
  window.localStorage.setItem(STORAGE_KEYS.auditEvents, JSON.stringify(pruned));
  setAuditPrunedAt(new Date().toISOString());
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

export function loadStageSlaHours(defaultValue = {}) {
  if (!isClient()) return defaultValue;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEYS.stageSlaHours), null);
  return stored && typeof stored === 'object' ? stored : defaultValue;
}

export function saveStageSlaHours(values) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.stageSlaHours, JSON.stringify(values || {}));
}

export function loadLocalAuthUsers() {
  if (!isClient()) return [];
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEYS.localAuthUsers), []);
  return Array.isArray(stored) ? stored : [];
}

export function saveLocalAuthUsers(users) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.localAuthUsers, JSON.stringify(users || []));
}

export function loadLocalSession() {
  if (!isClient()) return null;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEYS.localSession), null);
  return stored && typeof stored === 'object' ? stored : null;
}

export function saveLocalSession(sessionUser) {
  if (!isClient()) return;
  window.localStorage.setItem(STORAGE_KEYS.localSession, JSON.stringify(sessionUser || null));
}

export function clearLocalSession() {
  if (!isClient()) return;
  window.localStorage.removeItem(STORAGE_KEYS.localSession);
}
