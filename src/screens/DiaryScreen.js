import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Meter from '../components/Meter';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import WaterTrackerCard from '../components/WaterTrackerCard';
import NutritionSummaryCard from '../components/NutritionSummaryCard';
import { addDays, formatDayLabel, formatClock, todayISO } from '../utils/date';
import { removeItem, addMealTemplate } from '../redux/slices/nutritionSlice';
import { buildTemplate } from '../utils/mealTemplates';
import { sumMeals } from '../utils/nutrition';

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

const DiaryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const today = todayISO();
  const { dailyLog, history } = useSelector((state) => state.nutrition);
  const targets = useSelector((state) => state.user.targets);
  const [selectedDate, setSelectedDate] = useState(today);

  const isToday = selectedDate === today;
  const day = isToday
    ? dailyLog
    : history.find((entry) => entry.date === selectedDate) || null;

  const totals = useMemo(() => (day ? day.totals || sumMeals(day.meals) : null), [day]);
  const meals = day?.meals || [];

  const openMealEntry = (mealType) => {
    navigation.navigate('MealEntry', { mealType, date: selectedDate });
  };

  return (
    <ScreenScaffold title="Diary" subtitle={formatDayLabel(selectedDate)}>
      <View style={styles.dayBar}>
        <Pressable
          onPress={() => setSelectedDate(addDays(selectedDate, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          style={styles.dayButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={iconSize.lg} color={colors.ink} />
        </Pressable>
        <View style={styles.dayCenter}>
          <Text style={[typography.heading, styles.dayLabel]}>
            {isToday ? 'Today' : formatDayLabel(selectedDate)}
          </Text>
          {!isToday ? <Badge label="Read only" tone="muted" /> : null}
        </View>
        <Pressable
          onPress={() => setSelectedDate(addDays(selectedDate, 1))}
          disabled={isToday}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: isToday }}
          style={[styles.dayButton, isToday && styles.dayButtonDisabled]}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={iconSize.lg}
            color={isToday ? colors.inkTertiary : colors.ink}
          />
        </Pressable>
      </View>

      {!day ? (
        <Card>
          <EmptyState
            icon="calendar-blank-outline"
            title="Nothing logged that day"
            body="Days with no food or water are not stored, so there is nothing to show."
            action={{ label: 'Back to today', onPress: () => setSelectedDate(today) }}
          />
        </Card>
      ) : (
        <>
          <NutritionSummaryCard totals={totals} targets={targets} />

          {MEAL_SLOTS.map((slot) => {
            const slotMeals = meals.filter((meal) => meal.type === slot.key);
            const calories = slotMeals.reduce(
              (sum, meal) => sum + (meal.total?.calories || 0),
              0
            );

            return (
              <Card key={slot.key}>
                <View style={styles.slotHeader}>
                  <Text style={[typography.heading, styles.slotTitle]}>{slot.label}</Text>
                  <View style={styles.slotActions}>
                    <Text style={[typography.caption, styles.slotCalories]}>
                      {Math.round(calories)} kcal
                    </Text>
                    {isToday && slotMeals.length ? (
                      <Pressable
                        onPress={() => {
                          const template = buildTemplate(slotMeals, { type: slot.key });
                          if (template) dispatch(addMealTemplate(template));
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Save ${slot.label.toLowerCase()} as a reusable meal`}
                        hitSlop={8}
                        style={styles.saveButton}
                      >
                        <MaterialCommunityIcons name="star-outline" size={iconSize.sm} color={colors.inkTertiary} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {slotMeals.length === 0 ? (
                  <Text style={[typography.caption, styles.slotEmpty]}>Nothing logged</Text>
                ) : (
                  slotMeals.map((meal) =>
                    meal.items.map((item, index) => (
                      <View key={item.id}>
                        {index > 0 ? <View style={styles.divider} /> : null}
                        <View style={styles.itemRow}>
                          <View style={styles.itemText}>
                            <Text style={[typography.body, styles.itemName]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[typography.caption, styles.itemMeta]}>
                              {item.portionLabel || `${item.quantity} × ${item.serving}`}
                              {item.grams ? ` · ${Math.round(item.grams)} g` : ''}
                              {meal.time ? ` · ${formatClock(meal.time)}` : ''}
                            </Text>
                          </View>
                          <Text style={[typography.caption, styles.itemCalories]}>
                            {Math.round(item.calories)} kcal
                          </Text>
                          {isToday ? (
                            <Pressable
                              onPress={() =>
                                dispatch(removeItem({ mealId: meal.id, itemId: item.id }))
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Remove ${item.name}`}
                              hitSlop={8}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={iconSize.sm}
                                color={colors.inkTertiary}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )
                )}

                {isToday ? (
                  <Button
                    label={`Add to ${slot.label.toLowerCase()}`}
                    variant="secondary"
                    size="md"
                    icon="plus"
                    onPress={() => openMealEntry(slot.key)}
                  />
                ) : null}
              </Card>
            );
          })}

          {isToday ? (
            <WaterTrackerCard waterMl={day.water} targetMl={targets.water} />
          ) : (
            <Card>
              <Meter value={day.water || 0} target={targets.water} label="Water" />
            </Card>
          )}
        </>
      )}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dayButtonDisabled: { opacity: 0.4 },
  dayCenter: { alignItems: 'center', gap: space.xs },
  dayLabel: { color: colors.ink },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  slotTitle: { color: colors.ink },
  slotActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  saveButton: { padding: 2 },
  slotCalories: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  slotEmpty: { color: colors.inkTertiary, marginBottom: space.md },
  divider: { height: 1, backgroundColor: colors.line },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  itemText: { flex: 1, gap: 2 },
  itemName: { color: colors.ink },
  itemMeta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  itemCalories: { color: colors.ink, fontVariant: ['tabular-nums'] },
});

export default DiaryScreen;
