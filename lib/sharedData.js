import { supabase, isSupabaseConfigured } from './supabaseClient';
import { normalizeStatus } from './statuses';
import { sanitizeStageElapsedMap } from './time';
import {
  appendAuditEvent,
  loadAuditEvents,
  loadStageSlaHours,
  loadVehicles,
  saveAuditEvents,
  saveStageSlaHours,
  saveVehicles,
  STORAGE_KEYS,
} from './persistence';

const ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'default-org';

let syncHealth = {
  mode: isSupabaseConfigured ? 'unknown' : 'local',
  detail: isSupabaseConfigured ? 'Sync check pending' : 'Supabase not configured',
  checkedAt: null,
};

function setSyncHealth(mode, detail) {
  syncHealth = {
    mode,
    detail,
    checkedAt: new Date().toISOString(),
  };
}

export function getSyncHealthSnapshot() {
  return { ...syncHealth };
}

function toVehicleFromRow(row) {
  const createdAt = row.created_at || new Date().toISOString();
  return {
    id: row.id,
    stockNumber: row.stock_number,
    vin: row.vin,
    color: row.color,
    year: row.year,
    make: row.make,
    model: row.model,
    notes: row.notes || '',
    status: normalizeStatus(row.status),
    createdAt,
    stageEnteredAt: row.stage_entered_at || createdAt,
    stageElapsedMs: sanitizeStageElapsedMap(row.stage_elapsed_ms),
    completedAt: row.completed_at,
  };
}

function toVehicleRow(vehicle) {
  return {
    id: vehicle.id,
    organization_id: ORGANIZATION_ID,
    stock_number: vehicle.stockNumber || null,
    vin: vehicle.vin || null,
    color: vehicle.color || null,
    year: vehicle.year || null,
    make: vehicle.make || null,
    model: vehicle.model || null,
    notes: vehicle.notes || '',
    status: normalizeStatus(vehicle.status) || null,
    created_at: vehicle.createdAt || new Date().toISOString(),
    stage_entered_at: vehicle.stageEnteredAt || vehicle.createdAt || new Date().toISOString(),
    stage_elapsed_ms: sanitizeStageElapsedMap(vehicle.stageElapsedMs),
    completed_at: vehicle.completedAt || null,
    updated_at: new Date().toISOString(),
  };
}

function toAuditFromRow(row) {
  return {
    actor: row.actor_email,
    action: row.action,
    stockNumber: row.stock_number,
    year: row.year,
    make: row.make,
    model: row.model,
    status: row.status,
    time: row.event_time,
  };
}

function toAuditRow(entry) {
  return {
    organization_id: ORGANIZATION_ID,
    actor_email: entry.actor || 'unknown',
    action: entry.action,
    stock_number: entry.stockNumber || null,
    year: entry.year || null,
    make: entry.make || null,
    model: entry.model || null,
    status: entry.status || null,
    event_time: entry.time || new Date().toISOString(),
  };
}

export async function fetchVehiclesShared() {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return loadVehicles().map((vehicle) => {
      const createdAt = vehicle.createdAt || new Date().toISOString();
      return {
        ...vehicle,
        status: normalizeStatus(vehicle.status),
        createdAt,
        stageEnteredAt: vehicle.stageEnteredAt || createdAt,
        stageElapsedMs: sanitizeStageElapsedMap(vehicle.stageElapsedMs),
      };
    });
  }

  const localVehicles = loadVehicles().map((vehicle) => {
    const createdAt = vehicle.createdAt || new Date().toISOString();
    return {
      ...vehicle,
      status: normalizeStatus(vehicle.status),
      createdAt,
      stageEnteredAt: vehicle.stageEnteredAt || createdAt,
      stageElapsedMs: sanitizeStageElapsedMap(vehicle.stageElapsedMs),
    };
  });

  const { data, error } = await supabase
    .from('recon_vehicles')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Unable to load vehicles from Supabase, using local fallback.', error.message);
    setSyncHealth('local', `Cloud read failed: ${error.message}`);
    return localVehicles;
  }

  if ((!data || data.length === 0) && localVehicles.length > 0) {
    const seedRows = localVehicles.map(toVehicleRow);
    const { error: seedError } = await supabase.from('recon_vehicles').upsert(seedRows);
    if (!seedError) {
      setSyncHealth('cloud', 'Connected to Cloud');
      return localVehicles;
    }
    console.error('Unable to seed vehicles into Supabase, using local fallback.', seedError.message);
    setSyncHealth('local', `Cloud seed failed: ${seedError.message}`);
    return localVehicles;
  }

  const mapped = (data || []).map(toVehicleFromRow);
  saveVehicles(mapped);
  setSyncHealth('cloud', 'Connected to Cloud');
  return mapped;
}

export async function createVehicleShared(vehicle) {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return { data: vehicle, error: null };
  }

  const result = await supabase.from('recon_vehicles').upsert(toVehicleRow(vehicle));
  if (result.error) {
    setSyncHealth('local', `Cloud write failed: ${result.error.message}`);
  } else {
    setSyncHealth('cloud', 'Connected to Cloud');
  }
  return result;
}

export async function updateVehicleShared(id, updates) {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return { data: null, error: null };
  }

  const payload = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(updates, 'stockNumber')) payload.stock_number = updates.stockNumber || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'vin')) payload.vin = updates.vin || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'color')) payload.color = updates.color || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'year')) payload.year = updates.year || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'make')) payload.make = updates.make || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'model')) payload.model = updates.model || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) payload.notes = updates.notes || '';
  if (Object.prototype.hasOwnProperty.call(updates, 'status')) payload.status = updates.status || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'createdAt')) payload.created_at = updates.createdAt || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'stageEnteredAt')) payload.stage_entered_at = updates.stageEnteredAt || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'stageElapsedMs')) payload.stage_elapsed_ms = sanitizeStageElapsedMap(updates.stageElapsedMs);
  if (Object.prototype.hasOwnProperty.call(updates, 'completedAt')) payload.completed_at = updates.completedAt || null;

  const result = await supabase.from('recon_vehicles').update(payload).eq('id', id).eq('organization_id', ORGANIZATION_ID);
  if (result.error) {
    setSyncHealth('local', `Cloud update failed: ${result.error.message}`);
  } else {
    setSyncHealth('cloud', 'Connected to Cloud');
  }
  return result;
}

export async function deleteVehicleShared(id) {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return { data: null, error: null };
  }

  const result = await supabase.from('recon_vehicles').delete().eq('id', id).eq('organization_id', ORGANIZATION_ID);
  if (result.error) {
    setSyncHealth('local', `Cloud delete failed: ${result.error.message}`);
  } else {
    setSyncHealth('cloud', 'Connected to Cloud');
  }
  return result;
}

export async function fetchAuditEventsShared() {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return loadAuditEvents();
  }

  const localAudit = loadAuditEvents();

  const { data, error } = await supabase
    .from('recon_audit_events')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .order('event_time', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Unable to load audit events from Supabase, using local fallback.', error.message);
    setSyncHealth('local', `Cloud read failed: ${error.message}`);
    return localAudit;
  }

  if ((!data || data.length === 0) && localAudit.length > 0) {
    const seedRows = localAudit.map(toAuditRow);
    const { error: seedError } = await supabase.from('recon_audit_events').insert(seedRows);
    if (!seedError) {
      setSyncHealth('cloud', 'Connected to Cloud');
      return localAudit;
    }
    console.error('Unable to seed audit events into Supabase, using local fallback.', seedError.message);
    setSyncHealth('local', `Cloud seed failed: ${seedError.message}`);
    return localAudit;
  }

  const mapped = (data || []).map(toAuditFromRow);
  saveAuditEvents(mapped);
  setSyncHealth('cloud', 'Connected to Cloud');
  return mapped;
}

export async function appendAuditEventShared(entry) {
  appendAuditEvent(entry);

  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return { data: entry, error: null };
  }

  const result = await supabase.from('recon_audit_events').insert(toAuditRow(entry));
  if (result.error) {
    setSyncHealth('local', `Cloud write failed: ${result.error.message}`);
  } else {
    setSyncHealth('cloud', 'Connected to Cloud');
  }
  return result;
}

export async function fetchStageSlaHoursShared(defaultValue = {}) {
  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return loadStageSlaHours(defaultValue);
  }

  const localSla = loadStageSlaHours(defaultValue);

  const { data, error } = await supabase
    .from('recon_stage_sla_targets')
    .select('status, target_hours')
    .eq('organization_id', ORGANIZATION_ID);

  if (error) {
    console.error('Unable to load SLA values from Supabase, using local fallback.', error.message);
    setSyncHealth('local', `Cloud read failed: ${error.message}`);
    return localSla;
  }

  if ((!data || data.length === 0) && localSla && Object.keys(localSla).length > 0) {
    const seedRows = Object.entries(localSla).map(([status, targetHours]) => ({
      organization_id: ORGANIZATION_ID,
      status,
      target_hours: Number(targetHours) || 72,
      updated_at: new Date().toISOString(),
    }));
    const { error: seedError } = await supabase.from('recon_stage_sla_targets').upsert(seedRows);
    if (!seedError) {
      setSyncHealth('cloud', 'Connected to Cloud');
      return localSla;
    }
    console.error('Unable to seed SLA values into Supabase, using local fallback.', seedError.message);
    setSyncHealth('local', `Cloud seed failed: ${seedError.message}`);
    return localSla;
  }

  const mapped = { ...defaultValue };
  (data || []).forEach((row) => {
    mapped[row.status] = Number(row.target_hours) || mapped[row.status] || 72;
  });

  saveStageSlaHours(mapped);
  setSyncHealth('cloud', 'Connected to Cloud');
  return mapped;
}

export async function saveStageSlaTargetShared(status, targetHours) {
  saveStageSlaHours({ ...loadStageSlaHours({}), [status]: targetHours });

  if (!isSupabaseConfigured) {
    setSyncHealth('local', 'Supabase not configured');
    return { data: null, error: null };
  }

  const result = await supabase.from('recon_stage_sla_targets').upsert({
    organization_id: ORGANIZATION_ID,
    status,
    target_hours: targetHours,
    updated_at: new Date().toISOString(),
  });

  if (result.error) {
    setSyncHealth('local', `Cloud write failed: ${result.error.message}`);
  } else {
    setSyncHealth('cloud', 'Connected to Cloud');
  }

  return result;
}

export function subscribeSharedChanges(onChange) {
  if (!isSupabaseConfigured) {
    const handler = (event) => {
      if (
        event.key === STORAGE_KEYS.vehicles ||
        event.key === STORAGE_KEYS.auditEvents ||
        event.key === STORAGE_KEYS.stageSlaHours
      ) {
        onChange();
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  const channel = supabase
    .channel(`recon-sync-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'recon_vehicles',
      filter: `organization_id=eq.${ORGANIZATION_ID}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'recon_audit_events',
      filter: `organization_id=eq.${ORGANIZATION_ID}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'recon_stage_sla_targets',
      filter: `organization_id=eq.${ORGANIZATION_ID}`,
    }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
