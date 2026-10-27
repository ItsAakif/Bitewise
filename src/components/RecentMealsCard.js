// Today's meals as hairline rows: meal name, what is in it, and its calories.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { EmptyState } from './EmptyState';
import { formatClock } from '../utils/date';

const LABEL = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const RecentMealsCard = ({ meals = [], style }) => {
  const rows = (meals || []).slice().reverse().slice(0, 4);

  return (
    <Card style={style}>
      <SectionHeader title="Today's meals" />
      {rows.length === 0 ? (
        <EmptyState
          icon="silverware-fork-knife"
          title="Nothing logged yet"
          body="Meals you add today will be listed here with their calories."
        />
      ) : (
        rows.map((meal, index) => {
          const itemCount = (meal.items || []).length;
          const calories = Math.round(meal.total?.calories || 0);
          return (
            <View key={meal.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={[typography.body, styles.name]}>
                    {LABEL[meal.type] || 'Meal'}
                  </Text>
                  <Text style={[typography.caption, styles.meta]}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    {meal.time ? ` · ${formatClock(meal.time)}` : ''}
                  </Text>
                </View>
                <Text style={[typography.body, styles.calories]}>
                  {calories.toLocaleString('en-US')} kcal
                </Text>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    gap: space.sm,
  },
  info: { flex: 1, gap: 2 },
  name: { color: colors.ink },
  meta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  calories: { color: colors.ink, fontVariant: ['tabular-nums'] },
});

export default RecentMealsCard;
