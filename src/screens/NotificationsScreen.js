import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Switch } from 'react-native-paper';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { updateSettings } from '../redux/slices/userSlice';
import { syncReminders } from '../utils/reminders';

const SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'water', label: 'Water' },
];

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.user.settings);
  const [draft, setDraft] = useState(settings.reminders);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    dispatch(updateSettings({ reminders: draft }));
    const result = await syncReminders({ enabled: settings.notifications, reminders: draft });
    setBusy(false);
    setStatus(
      result.ok
        ? result.scheduled > 0
          ? `${result.scheduled} reminders scheduled.`
          : 'Reminders are off, so nothing was scheduled.'
        : result.reason
    );
  };

  const toggleEnabled = async (value) => {
    dispatch(updateSettings({ notifications: value }));
    const result = await syncReminders({ enabled: value, reminders: draft });
    setStatus(
      result.ok
        ? value
          ? `${result.scheduled} reminders scheduled.`
          : 'Reminders turned off.'
        : result.reason
    );
  };

  return (
    <ScreenScaffold title="Reminders" subtitle="Local notifications, scheduled on this device" onBack={() => navigation.goBack()}>
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={[typography.body, styles.title]}>Reminders</Text>
            <Text style={[typography.caption, styles.note]}>
              Fires even when the app is closed, if notifications are allowed.
            </Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={toggleEnabled}
            color={colors.accent}
            accessibilityLabel="Enable reminders"
          />
        </View>
      </Card>

      <Card>
        <Text style={[typography.label, styles.label]}>Times (24-hour)</Text>
        {SLOTS.map((slot) => (
          <Input
            key={slot.key}
            label={slot.label}
            value={draft[slot.key]}
            onChangeText={(value) => setDraft((current) => ({ ...current, [slot.key]: value }))}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            helper="Leave as HH:MM"
          />
        ))}
        <Button label="Save times" onPress={save} loading={busy} />
        {status ? <Text style={[typography.caption, styles.status]}>{status}</Text> : null}
      </Card>

      <Text style={[typography.caption, styles.footnote]}>
        Times are saved whether or not permission is granted. If you deny permission, the
        times stay here and nothing is scheduled.
      </Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  switchText: { flex: 1, gap: 2 },
  title: { color: colors.ink },
  note: { color: colors.inkSecondary },
  label: { color: colors.inkSecondary, marginBottom: space.sm },
  status: { color: colors.accent, marginTop: space.sm },
  footnote: { color: colors.inkTertiary },
});

export default NotificationsScreen;
