// Section heading with optional trailing action ("See all" pattern).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';

export const SectionHeader = ({ title, action }) => (
  <View style={styles.row}>
    <Text style={[typography.heading, { color: colors.ink }]}>{title}</Text>
    {action && (
      <Pressable
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        hitSlop={8}
      >
        <Text style={[typography.label, styles.action]}>{action.label}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  action: {
    color: colors.accent,
  },
});

export default SectionHeader;
