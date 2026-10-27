// Two-to-four way switch. Used for ranges (7 / 30 days) and categories.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';

export const Segmented = ({ options = [], value, onChange }) => (
  <View style={styles.group} accessibilityRole="tablist">
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="tab"
          accessibilityLabel={option.label}
          accessibilityState={{ selected }}
          style={[styles.segment, selected && styles.selected]}
        >
          <Text style={[typography.label, selected ? styles.selectedText : styles.text]}>
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    minHeight: 38,
  },
  selected: {
    backgroundColor: colors.accentSoft,
  },
  text: { color: colors.inkSecondary },
  selectedText: { color: colors.accent },
});

export default Segmented;
