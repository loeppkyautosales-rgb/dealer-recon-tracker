export const statuses = [
  'New Inventory Received',
  'Pending Inspection',
  'Awaiting Parts',
  'Approved for Reconditioning',
  'Reconditioning in Progress',
  'Frontline Ready',
];

export const QUICK_CLEAN_STATUS = 'Quick Clean Requested';
export const FINAL_STATUS = 'Frontline Ready';

const legacyStatusMap = {
  'New Arrivals': 'New Inventory Received',
  'Pending Safety': 'Pending Inspection',
  'Ready For Recon': 'Awaiting Parts',
  'Recon In Progress': 'Reconditioning in Progress',
  'Recon Complete': 'Frontline Ready',
};

export function normalizeStatus(status) {
  if (!status) return statuses[0];
  if (legacyStatusMap[status]) return legacyStatusMap[status];
  if (status === QUICK_CLEAN_STATUS) return QUICK_CLEAN_STATUS;
  if (statuses.includes(status)) return status;
  return statuses[0];
}
