// Today's totals: calories as the one dominant number, macros as StatRows.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { StatRow } from './StatRow';
import { EmptyState } from './EmptyState';

const n = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);

const Divider = () => <View style={styles.divider} />;

export const NutritionSummaryCard = ({ totals, targets, style }) => (
  <Card style={style}>
    <SectionHeader title="Today's Nutrition" />
    {(!totals || !targets) && (
      <EmptyState
        icon="food-variant"
        title="No nutrition data"
        body="Log a meal to see today's totals."
      />
    )}
    {totals && targets && (
      <View>
        <Text style={[typography.title, styles.calories]}>
          {n(totals.calories).toLocaleString('en-US')}
          <Text style={styles.unit}> kcal</Text>
        </Text>
        <View>
          <StatRow
            label="Protein"
            value={`${n(totals.protein)}g`}
            target={`${n(targets.protein)}g`}
          />
          <Divider />
          <StatRow
            label="Carbs"
            value={`${n(totals.carbs)}g`}
            target={`${n(targets.carbs)}g`}
          />
          <Divider />
          <StatRow
            label="Fat"
            value={`${n(totals.fat)}g`}
            target={`${n(targets.fat)}g`}
          />
        </View>
      </View>
    )}
  </Card>
);

const styles = StyleSheet.create({
  calories: {
    color: colors.ink,
    marginBottom: space.sm,
  },
  unit: {
    ...typography.label,
    color: colors.inkSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
});

export default NutritionSummaryCard;
