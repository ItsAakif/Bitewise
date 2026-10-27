// Water. Stored in millilitres, counted in 250 ml glasses because that is how
// people pour. One meter, two controls, no decorative droplet animation.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { colors, typography, space, radius, iconSize } from '../theme';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { Meter } from './Meter';
import { addWater } from '../redux/slices/nutritionSlice';
import { glasses } from '../utils/nutrition';

const GLASS_ML = 250;

export const WaterTrackerCard = ({ waterMl = 0, targetMl = 2000, style }) => {
  const dispatch = useDispatch();
  const current = Math.round(Number(waterMl) || 0);
  const target = Math.round(Number(targetMl) || 0);

  const adjust = (deltaMl) => {
    dispatch(addWater(deltaMl));
  };

  return (
    <Card style={style}>
      <SectionHeader title="Water" />
      <Meter
        value={current}
        target={target}
        label={`${glasses(current)} of ${glasses(target) || 8} glasses`}
      />
      <Text style={[typography.caption, styles.volume]}>
        {current.toLocaleString('en-US')} ml of {target.toLocaleString('en-US')} ml
      </Text>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => adjust(-GLASS_ML)}
          disabled={current <= 0}
          accessibilityRole="button"
          accessibilityLabel="Remove one glass of water"
          accessibilityState={{ disabled: current <= 0 }}
          style={[styles.iconButton, current <= 0 && styles.disabled]}
        >
          <MaterialCommunityIcons
            name="minus"
            size={iconSize.md}
            color={current <= 0 ? colors.inkTertiary : colors.accent}
          />
        </Pressable>
        <Pressable
          onPress={() => adjust(GLASS_ML)}
          accessibilityRole="button"
          accessibilityLabel="Add one glass of water"
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="plus" size={iconSize.md} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={() => adjust(500)}
          accessibilityRole="button"
          accessibilityLabel="Add half a litre"
          style={styles.wideButton}
        >
          <Text style={[typography.caption, styles.wideLabel]}>+500 ml</Text>
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  volume: {
    color: colors.inkTertiary,
    fontVariant: ['tabular-nums'],
    marginTop: space.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  iconButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: space.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideLabel: { color: colors.inkSecondary },
  disabled: { opacity: 0.4 },
});

export default WaterTrackerCard;
