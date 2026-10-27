// One row in a list: icon, title, optional subtitle, optional right slot.
// Rows are separated by the parent's hairline dividers, never by their own card.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, iconSize } from '../theme';

export const ListRow = ({ icon, title, subtitle, right, onPress, disabled = false, danger = false }) => {
  const interactive = typeof onPress === 'function' && !disabled;
  const Wrapper = interactive ? Pressable : View;

  return (
    <Wrapper
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={title}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={({ pressed } = {}) => [
        styles.row,
        pressed && interactive && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize.md}
          color={danger ? colors.danger : colors.inkSecondary}
        />
      ) : null}
      <View style={styles.text}>
        <Text
          style={[
            typography.body,
            { color: danger ? colors.danger : colors.ink },
            disabled && styles.dimText,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.caption, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (interactive ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={colors.inkTertiary}
        />
      ) : null)}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.55,
  },
  dimText: {
    color: colors.inkTertiary,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    color: colors.inkSecondary,
  },
});

export default ListRow;
