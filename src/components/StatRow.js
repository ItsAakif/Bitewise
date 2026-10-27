// One measured line: label on the left, tabular value (+ optional target)
// on the right. Rows sit on hairline dividers provided by the parent.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';

const toneColors = {
  accent: colors.accent,
  ink: colors.ink,
  muted: colors.inkSecondary,
};

export const StatRow = ({ label, value, target, tone = 'ink' }) => {
  const valueColor = toneColors[tone] || colors.ink;
  const valueText = target != null ? `${value} / ${target}` : `${value}`;
  return (
    <View style={styles.row}>
      <Text style={[typography.body, styles.label]}>{label}</Text>
      <Text style={[typography.body, styles.value, { color: valueColor }]}>
        {valueText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  label: {
    color: colors.inkSecondary,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
});

export default StatRow;
