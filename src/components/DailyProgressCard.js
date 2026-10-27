// Daily progress as four scannable Meter rows — no progress rings.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { space } from '../theme';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { Meter } from './Meter';
import { EmptyState } from './EmptyState';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const MACROS = [
  { key: 'calories', label: 'Calories', meter: 'calories' },
  { key: 'protein', label: 'Protein', meter: 'protein' },
  { key: 'carbs', label: 'Carbs', meter: 'carbs' },
  { key: 'fat', label: 'Fat', meter: 'fat' },
];

export const DailyProgressCard = ({ progress, targets, style }) => (
  <Card style={style}>
    <SectionHeader title="Daily Progress" />
    {(!progress || !targets) && (
      <EmptyState
        icon="chart-line"
        title="No progress yet"
        body="Progress toward your daily targets appears here."
      />
    )}
    {progress && targets && (
      <View style={styles.rows}>
        {MACROS.map((macro) => (
          <Meter
            key={macro.key}
            label={macro.label}
            tone={macro.meter}
            value={num(progress[macro.key])}
            target={num(targets[macro.key])}
          />
        ))}
      </View>
    )}
  </Card>
);

const styles = StyleSheet.create({
  rows: {
    gap: space.xs / 2,
  },
});

export default DailyProgressCard;
