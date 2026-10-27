// Workout catalogue row. Metadata is the three numbers that decide whether you
// do it now: minutes, effort, calories.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../../theme';
import { workoutIcon } from '../../utils/catalog';

const INTENSITY_LABEL = { low: 'Easy', moderate: 'Moderate', high: 'Hard' };

export const WorkoutCard = ({ workout, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${workout.name}, ${workout.minutes} minutes`}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    <MaterialCommunityIcons
      name={workoutIcon(workout)}
      size={iconSize.lg}
      color={colors.inkSecondary}
    />
    <View style={styles.text}>
      <Text style={[typography.body, styles.title]} numberOfLines={1}>
        {workout.name}
      </Text>
      <Text style={[typography.caption, styles.meta]}>
        {workout.minutes} min · {INTENSITY_LABEL[workout.intensity]} · {workout.calories} kcal
      </Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={iconSize.md} color={colors.inkTertiary} />
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
    minHeight: 64,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.ink,
  },
  meta: {
    color: colors.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
});

export default WorkoutCard;
