// Filter chip. Selected state is a tinted surface plus accent text — the chip
// carries its own selection, no checkmark decoration.
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';

export const Chip = ({ label, selected = false, onPress, icon }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    style={[styles.chip, selected && styles.selected]}
  >
    {icon ? (
      <MaterialCommunityIcons
        name={icon}
        size={iconSize.sm}
        color={selected ? colors.accent : colors.inkSecondary}
      />
    ) : null}
    <Text style={[typography.caption, selected ? styles.selectedText : styles.text]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  text: { color: colors.inkSecondary },
  selectedText: { color: colors.accent },
});

export default Chip;
