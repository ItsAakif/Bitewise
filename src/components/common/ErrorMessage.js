// Inline error with an optional retry action. Buttons stay bordered,
// never filled tiles, so this reads as an error and not a CTA.
import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { colors, typography, space, radius } from '../../theme';

export const ErrorMessage = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={[typography.body, styles.message]}>{message}</Text>
    {onRetry && (
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        style={styles.retry}
        hitSlop={8}
      >
        <Text style={[typography.label, styles.retryLabel]}>Retry</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.sm,
    padding: space.base,
  },
  message: {
    color: colors.danger,
    textAlign: 'center',
  },
  retry: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.base,
  },
  retryLabel: {
    color: colors.accent,
  },
});

export default ErrorMessage;
