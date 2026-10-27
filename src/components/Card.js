// Flat hairline card — surface background, 1px line border, lg radius.
// No elevation, no shadow, no onPress: a card is a region, not a button.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space, radius, shadows } from '../theme';

export const Card = ({ children, padded = true, style }) => (
  <View style={[styles.card, padded && styles.padded, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    ...shadows.card,
    borderRadius: radius.lg,
  },
  padded: {
    padding: space.base,
  },
});

export default Card;
