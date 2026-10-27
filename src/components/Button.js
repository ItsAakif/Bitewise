// Primary action component. Three variants, two sizes, loading and icon slots.
import React from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';

const HEIGHT = { md: 44, lg: 52 };

const palette = {
  primary: { background: colors.accent, border: colors.accent, text: colors.onAccent },
  secondary: { background: colors.surface, border: colors.lineStrong, text: colors.ink },
  ghost: { background: 'transparent', border: 'transparent', text: colors.accent },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}) => {
  const scheme = palette[variant] || palette.primary;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size] || HEIGHT.md,
          backgroundColor: scheme.background,
          borderColor: scheme.border,
          opacity: inactive ? 0.5 : 1,
        },
        pressed && styles.pressed,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={scheme.text} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={iconSize.md} color={scheme.text} />
          ) : null}
          <Text style={[typography.label, { color: scheme.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
  },
  ghost: {
    borderWidth: 0,
    paddingHorizontal: space.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  // Static transform. Never write `transform: condition ? [...] : undefined` in an
  // inline style: the key stays present and React Native calls .forEach on it,
  // which throws "Cannot read property 'forEach' of null".
  pressed: {
    transform: [{ scale: 0.995 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});

export default Button;
