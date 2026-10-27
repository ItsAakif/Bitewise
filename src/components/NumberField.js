// Numeric field with stepper buttons. Typing is allowed; the value is clamped on
// blur so a target can never become zero or negative by accident.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';

export const NumberField = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
  unit,
  error,
  helper,
}) => {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? String(value ?? '');

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const commit = () => {
    const parsed = Number(draft);
    const next = Number.isFinite(parsed) ? clamp(parsed) : value;
    setDraft(null);
    onChange(next);
  };

  const nudge = (delta) => {
    const base = Number(draft ?? value) || 0;
    setDraft(null);
    onChange(clamp(base + delta));
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[typography.label, styles.label]}>{label}</Text> : null}
      <View style={[styles.row, error && styles.rowError]}>
        <Pressable
          onPress={() => nudge(-step)}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label || 'value'}`}
          style={styles.stepper}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="minus" size={iconSize.md} color={colors.ink} />
        </Pressable>
        <TextInput
          value={shown}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="numeric"
          accessibilityLabel={label}
          style={[typography.body, styles.input]}
        />
        {unit ? <Text style={[typography.caption, styles.unit]}>{unit}</Text> : null}
        <Pressable
          onPress={() => nudge(step)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label || 'value'}`}
          style={styles.stepper}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="plus" size={iconSize.md} color={colors.ink} />
        </Pressable>
      </View>
      {error ? (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      ) : helper ? (
        <Text style={[typography.caption, styles.helper]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: space.xs },
  label: { color: colors.inkSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  rowError: { borderColor: colors.danger },
  stepper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  unit: { color: colors.inkSecondary, marginRight: space.xs },
  helper: { color: colors.inkTertiary },
  error: { color: colors.danger },
});

export default NumberField;
