// Status badge. One shape, three tones derived from theme tokens.
// Real status only — never decorative.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';

const tones = {
  accent: { backgroundColor: colors.accentSoft, color: colors.accent },
  muted: { backgroundColor: colors.line, color: colors.inkSecondary },
  danger: { backgroundColor: colors.danger, color: colors.onAccent },
};

export const Badge = ({ label, tone = 'accent' }) => {
  const palette = tones[tone] || tones.accent;
  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.text, { color: palette.color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingVertical: space.xs / 2,
    paddingHorizontal: space.sm,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
  },
});

export default Badge;
