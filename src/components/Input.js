// Labelled text field. Focus is carried by the border, not a glow.
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  maxLength,
  right,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={[typography.label, styles.label]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error && styles.fieldError,
          multiline && styles.fieldMultiline,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label || placeholder}
          style={[typography.body, styles.input, multiline && styles.inputMultiline]}
        />
        {right}
      </View>
      {error ? (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      ) : helper ? (
        <Text style={[typography.caption, styles.helper]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  label: {
    color: colors.inkSecondary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 44,
  },
  fieldFocused: {
    borderColor: colors.accent,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: space.sm,
    minHeight: 96,
  },
  input: {
    flex: 1,
    color: colors.ink,
    paddingVertical: space.sm,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  helper: {
    color: colors.inkTertiary,
  },
  error: {
    color: colors.danger,
  },
});

export default Input;
