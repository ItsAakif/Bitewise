// Quiet empty state: one icon, a title, optional body, optional action.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';

export const EmptyState = ({ icon, title, body, action }) => (
  <View style={styles.container}>
    {icon && (
      <MaterialCommunityIcons
        name={icon}
        size={iconSize.lg}
        color={colors.inkTertiary}
      />
    )}
    <Text style={[typography.heading, styles.title]}>{title}</Text>
    {body && <Text style={[typography.body, styles.body]}>{body}</Text>}
    {action && (
      <Pressable
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={styles.action}
        hitSlop={8}
      >
        <Text style={[typography.label, styles.actionLabel]}>
          {action.label}
        </Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  action: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.base,
    marginTop: space.xs / 2,
  },
  actionLabel: {
    color: colors.accent,
  },
});

export default EmptyState;
