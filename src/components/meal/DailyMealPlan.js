// One week of planned meals. Each day is a row of four slots, and every slot is
// a real recipe in the catalogue — never a placeholder name.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../../theme';
import { dayName } from '../../utils/mealPlan';
import { formatDayLabel } from '../../utils/date';

const SLOTS = [
  ['breakfast', 'Breakfast'],
  ['lunch', 'Lunch'],
  ['dinner', 'Dinner'],
  ['snack', 'Snack'],
];

export const DailyMealPlan = ({ plan, recipesById, onOpenRecipe }) => {
  if (!plan) return null;

  return (
    <View style={styles.week}>
      {plan.days.map((day) => {
        const dayCalories = SLOTS.reduce((sum, [slot]) => {
          const recipe = recipesById?.get?.(day.recipeIds?.[slot]);
          return sum + (recipe?.calories || 0);
        }, 0);

        return (
          <View key={day.date} style={styles.day}>
            <View style={styles.dayHeader}>
              <Text style={[typography.heading, styles.dayName]}>{dayName(day.date)}</Text>
              <Text style={[typography.caption, styles.dayDate]}>
                {formatDayLabel(day.date)}
              </Text>
              <Text style={[typography.caption, styles.dayCalories]}>
                {dayCalories} kcal
              </Text>
            </View>
            {SLOTS.map(([slot, label]) => {
              const id = day.recipeIds?.[slot];
              const recipe = id ? recipesById?.get?.(id) : null;
              return (
                <Pressable
                  key={slot}
                  onPress={recipe ? () => onOpenRecipe?.(recipe.id) : undefined}
                  disabled={!recipe}
                  accessibilityRole={recipe ? 'button' : undefined}
                  accessibilityLabel={recipe ? `${label}: ${recipe.name}` : `${label}: not planned`}
                  style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
                >
                  <Text style={[typography.caption, styles.slotLabel]}>{label}</Text>
                  <Text
                    style={[typography.body, recipe ? styles.slotValue : styles.slotEmpty]}
                    numberOfLines={1}
                  >
                    {recipe ? recipe.name : 'Not planned'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  week: { gap: space.lg },
  day: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.xs,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    paddingBottom: space.sm,
    marginBottom: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dayName: { color: colors.ink },
  dayDate: { color: colors.inkSecondary, flex: 1 },
  dayCalories: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  pressed: { opacity: 0.6 },
  slotLabel: { color: colors.inkTertiary, width: 72 },
  slotValue: { color: colors.ink, flex: 1 },
  slotEmpty: { color: colors.inkTertiary, flex: 1 },
});

export default DailyMealPlan;
