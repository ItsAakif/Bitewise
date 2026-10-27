// Seven (or thirty) thin bars. No axes, no gridlines, no legend — the number next
// to the chart carries the value and this only carries the shape. Renders
// nothing when there is no data; the caller owns the empty state.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';
import { weekdayInitial } from '../utils/date';

export const HistoryStrip = ({ series = [], metric = 'calories', target = 0, days = 7 }) => {
  if (!series.length) return null;

  const values = series.map((day) => Number(day[metric]) || 0);
  const peak = Math.max(target || 0, ...values, 1);
  const showLabels = series.length <= 7;

  return (
    <View accessibilityLabel={`${metric} for the last ${series.length} days`}>
      <View style={styles.bars}>
        {series.map((day) => {
          const value = Number(day[metric]) || 0;
          const height = Math.max(2, Math.round((value / peak) * 56));
          const metTarget = target > 0 && value >= target;
          return (
            <View key={day.date} style={styles.column}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      height,
                      backgroundColor: metTarget ? colors.accent : colors.macro.carbs,
                    },
                  ]}
                />
              </View>
              {showLabels ? (
                <Text style={[typography.caption, styles.label]}>
                  {weekdayInitial(day.date)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  track: {
    width: '100%',
    height: 56,
    justifyContent: 'flex-end',
    backgroundColor: colors.line,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: radius.sm,
  },
  label: {
    color: colors.inkTertiary,
  },
});

export default HistoryStrip;
