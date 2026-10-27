// Centered loading state with an optional caption.
import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { colors, typography, space } from '../../theme';

export const LoadingSpinner = ({ label }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.accent} />
    {label ? (
      <Text style={[typography.caption, styles.label]}>{label}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: space.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  label: {
    color: colors.inkSecondary,
  },
});

export default LoadingSpinner;
