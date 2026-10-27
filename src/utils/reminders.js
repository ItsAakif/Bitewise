// Local notification reminders. expo-notifications is load-guarded: a build
// without the native module reports unavailable instead of crashing, and the
// reminder times stay saved either way.

const NOTIF_ID_PREFIX = 'bitewise-reminder-';

function loadNotifications() {
  try {
    // eslint-disable-next-line global-require
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export function remindersAvailable() {
  return loadNotifications() != null;
}

/** Parses 'HH:MM' into { hour, minute }, or null. */
function parseClock(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ''));
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

const LABELS = {
  breakfast: 'Log breakfast',
  lunch: 'Log lunch',
  dinner: 'Log dinner',
  water: 'Drink water',
};

/**
 * Replaces every scheduled reminder with the current settings.
 * @returns {Promise<{ ok: boolean, reason?: string, scheduled: number }>}
 */
export async function syncReminders({ enabled, reminders }) {
  const Notifications = loadNotifications();
  if (!Notifications) {
    return { ok: false, reason: 'Notifications are not available in this build.', scheduled: 0 };
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return { ok: true, scheduled: 0 };

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'Notification permission was denied.', scheduled: 0 };
    }

    let scheduled = 0;
    for (const [key, clock] of Object.entries(reminders || {})) {
      const parsed = parseClock(clock);
      if (!parsed) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIF_ID_PREFIX}${key}`,
        content: {
          title: LABELS[key] || 'BiteWise',
          body: 'A quick reminder from your nutrition diary.',
        },
        trigger: Notifications.SchedulableTriggerInputTypes
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: parsed.hour,
              minute: parsed.minute,
            }
          : { hour: parsed.hour, minute: parsed.minute, repeats: true },
      });
      scheduled += 1;
    }
    return { ok: true, scheduled };
  } catch (error) {
    return {
      ok: false,
      reason: error?.message || 'Could not schedule reminders.',
      scheduled: 0,
    };
  }
}

export async function cancelReminders() {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled, or the module is unavailable.
  }
}
