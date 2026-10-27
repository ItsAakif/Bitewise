// A goal with its live progress. Actions expand in place rather than hiding in a
// menu, so completing a goal is one tap and never a mystery.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import Meter from './Meter';
import Badge from './Badge';

export const GoalCard = ({ goal, progress = 0, onToggle, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const done = Boolean(goal.completedAt);
  const unit = goal.unit ? ` ${goal.unit}` : '';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[typography.heading, done && styles.doneTitle]} numberOfLines={1}>
            {goal.title}
          </Text>
          {done ? <Badge label="Completed" tone="accent" /> : null}
        </View>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`${goal.title} actions`}
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'dots-horizontal'}
            size={iconSize.md}
            color={colors.inkSecondary}
          />
        </Pressable>
      </View>

      <Meter
        value={progress}
        target={goal.target}
        tone="accent"
        label={`${Math.round(progress)}${unit} of ${goal.target}${unit}`}
      />

      {open ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setOpen(false);
              onToggle?.(goal.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={done ? 'Mark as active' : 'Mark as complete'}
            style={styles.action}
          >
            <MaterialCommunityIcons
              name={done ? 'backup-restore' : 'check'}
              size={iconSize.sm}
              color={colors.accent}
            />
            <Text style={[typography.caption, styles.actionText]}>
              {done ? 'Reopen' : 'Complete'}
            </Text>
          </Pressable>
          {onEdit ? (
            <Pressable
              onPress={() => {
                setOpen(false);
                onEdit(goal);
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit goal"
              style={styles.action}
            >
              <MaterialCommunityIcons name="pencil" size={iconSize.sm} color={colors.accent} />
              <Text style={[typography.caption, styles.actionText]}>Edit</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              setOpen(false);
              onDelete?.(goal.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete goal"
            style={styles.action}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={iconSize.sm} color={colors.danger} />
            <Text style={[typography.caption, styles.deleteText]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  doneTitle: {
    color: colors.inkSecondary,
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    gap: space.lg,
    marginTop: space.xs,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  actionText: { color: colors.accent },
  deleteText: { color: colors.danger },
});

export default GoalCard;
