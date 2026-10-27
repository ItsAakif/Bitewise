// Health Connect (Android) and Apple Health adapter.
//
// The native module is optional: this file loads it defensively so a build
// without it still runs and the UI can say exactly what is missing. Enabling it
// is a one-command job — see README "Health data".
//
// Nothing here writes to the platform store. Reading steps and active energy is
// the useful direction for this app; writing our diary into the system store is
// a privacy decision the user has not asked for.

const MODULE = 'react-native-health-connect';

function load() {
  try {
    // eslint-disable-next-line global-require
    return require(MODULE);
  } catch {
    return null;
  }
}

export const HEALTH_CONNECT_INSTALL_HINT =
  `Health data needs the native module. Run: npx expo install ${MODULE} expo-build-properties, add "${MODULE}" to app.json plugins, then rebuild.`;

export function healthModuleAvailable() {
  return load() != null;
}

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Weight' },
];

/**
 * @returns {Promise<{ available: boolean, granted: boolean, reason?: string }>}
 */
export async function healthConnectStatus() {
  const hc = load();
  if (!hc) return { available: false, granted: false, reason: HEALTH_CONNECT_INSTALL_HINT };

  try {
    const initialised = await hc.initialize();
    if (!initialised) {
      return { available: false, granted: false, reason: 'Health Connect is not available on this device.' };
    }
    const granted = await hc.getGrantedPermissions();
    return { available: true, granted: (granted || []).length > 0 };
  } catch (error) {
    return { available: false, granted: false, reason: error?.message || 'Health Connect failed to start.' };
  }
}

export async function requestHealthAccess() {
  const hc = load();
  if (!hc) return { granted: false, reason: HEALTH_CONNECT_INSTALL_HINT };
  try {
    await hc.initialize();
    const result = await hc.requestPermission(PERMISSIONS);
    const granted = (result || []).some((entry) => entry.accessType === 'read');
    return granted
      ? { granted: true }
      : { granted: false, reason: 'Permission was not granted.' };
  } catch (error) {
    return { granted: false, reason: error?.message || 'Permission request failed.' };
  }
}

/** Steps recorded today, or null when the platform cannot answer. */
export async function readStepsToday() {
  const hc = load();
  if (!hc) return null;
  try {
    await hc.initialize();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await hc.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    const records = result?.records || [];
    if (!records.length) return 0;
    return records.reduce((total, record) => total + (Number(record.count) || 0), 0);
  } catch {
    return null;
  }
}
