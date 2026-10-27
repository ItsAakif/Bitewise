// Horizontal 4px meter: label left, tabular "current / target" right,
// fill below. Replaces every progress ring. tone is 'accent' or a macro
// key ('calories' | 'protein' | 'carbs' | 'fat').
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';

const toneColors = {
  accent: colors.accent,
  ...colors.macro,
};

const ratio = (value, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(Math.max(value / target, 0), 1);
};

export const Meter = ({ value, target, tone = 'accent', label }) => {
  const pct = ratio(value, target);
  const fill = toneColors[tone] || colors.accent;
  const valueText = `${Math.round(value).toLocaleString('en-US')} / ${Math.round(
    target || 0,
  ).toLocaleString('en-US')}`;
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        {label != null && (
          <Text style={[typography.label, styles.label]}>{label}</Text>
        )}
        <Text style={[typography.label, styles.value]}>{valueText}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: space.sm,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  label: {
    color: colors.inkSecondary,
  },
  value: {
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm,
  },
});

export default Meter;
