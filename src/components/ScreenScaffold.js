// The only place a screen declares its own header. Tab screens pass no onBack;
// stack screens do. This is what keeps twenty screens from each inventing one.
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, iconSize } from '../theme';

export const ScreenScaffold = ({
  title,
  subtitle,
  onBack,
  action,
  scroll = true,
  footer,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={styles.back}
          >
            <MaterialCommunityIcons name="chevron-left" size={iconSize.lg} color={colors.ink} />
          </Pressable>
        ) : null}
        <View style={styles.titleText}>
          <Text style={[typography.title, styles.title]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text>
          ) : null}
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={10}
            style={styles.action}
          >
            <MaterialCommunityIcons
              name={action.icon || 'dots-vertical'}
              size={iconSize.lg}
              color={colors.ink}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const body = <View style={[styles.body, !scroll && styles.bodyFill]}>{children}</View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: space.base,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  back: {
    marginLeft: -space.xs,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.ink,
  },
  subtitle: {
    color: colors.inkSecondary,
  },
  action: {
    padding: space.xs,
  },
  scrollContent: {
    paddingBottom: space.xxl,
  },
  body: {
    paddingHorizontal: space.base,
    gap: space.lg,
  },
  bodyFill: {
    flex: 1,
  },
  footer: {
    padding: space.base,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
});

export default ScreenScaffold;
