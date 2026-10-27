import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import NumberField from '../components/NumberField';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import { ALL_FOODS } from '../data';
import { MICRO_FIELDS } from '../data/micros';
import { applyOverride, normaliseOverride, hasOverride } from '../utils/foodOverrides';
import { setFoodOverride, clearFoodOverride } from '../redux/slices/nutritionSlice';

const FoodEditScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { foodId } = route.params || {};
  const overrides = useSelector((state) => state.nutrition.foodOverrides);
  const customFoods = useSelector((state) => state.nutrition.customFoods);

  const original = useMemo(
    () => [...customFoods, ...ALL_FOODS].find((food) => food.id === foodId),
    [foodId, customFoods]
  );

  const current = original ? applyOverride(original, overrides) : null;
  const edited = hasOverride(overrides, foodId);

  const [form, setForm] = useState(() => ({
    serving: current?.serving || '',
    calories: current?.calories ?? 0,
    protein: current?.protein ?? 0,
    carbs: current?.carbs ?? 0,
    fat: current?.fat ?? 0,
    ...Object.fromEntries(MICRO_FIELDS.map((field) => [field.key, current?.micros?.[field.key] ?? 0])),
  }));

  const set = (key) => (value) => setForm((row) => ({ ...row, [key]: value }));

  if (!original) {
    return (
      <ScreenScaffold title="Edit food" onBack={() => navigation.goBack()}>
        <Card>
          <EmptyState
            icon="help-circle-outline"
            title="Food not found"
            body="It may have come from an import that is no longer stored."
            action={{ label: 'Go back', onPress: () => navigation.goBack() }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  const save = () => {
    dispatch(setFoodOverride({ foodId, patch: normaliseOverride(form) }));
    navigation.goBack();
  };

  return (
    <ScreenScaffold
      title={original.name}
      subtitle={edited ? 'Your values' : 'Catalogue values'}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={edited ? 'Save my values' : 'Save changes'}
          onPress={save}
          fullWidth
        />
      }
    >
      <Card>
        <View style={styles.headerRow}>
          <Text style={[typography.body, styles.note]}>
            These are typical values, not measurements of what you ate. If you know your version
            better, correct it — the change applies everywhere this food appears.
          </Text>
          {edited ? <Badge label="Edited" /> : null}
        </View>
        <Input
          label="Serving these values refer to"
          value={form.serving}
          onChangeText={set('serving')}
          placeholder="150 g"
        />
      </Card>

      <Card>
        <SectionHeader title="Macros" />
        <NumberField label="Energy" unit="kcal" value={form.calories} min={0} max={2000} step={5} onChange={set('calories')} />
        <NumberField label="Protein" unit="g" value={form.protein} min={0} max={200} step={0.5} onChange={set('protein')} />
        <NumberField label="Carbohydrate" unit="g" value={form.carbs} min={0} max={300} step={1} onChange={set('carbs')} />
        <NumberField label="Fat" unit="g" value={form.fat} min={0} max={200} step={0.5} onChange={set('fat')} />
      </Card>

      <Card>
        <SectionHeader title="Micronutrients" />
        <Text style={[typography.caption, styles.note]}>
          Leave a nutrient at zero if you do not know it. Zero reads as "unknown" in the
          nutrient view, not as "contains none".
        </Text>
        {MICRO_FIELDS.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            unit={field.unit}
            value={form[field.key]}
            min={0}
            max={field.max}
            step={field.step}
            onChange={set(field.key)}
          />
        ))}
      </Card>

      {edited ? (
        <Button
          label="Revert to catalogue values"
          variant="ghost"
          onPress={() => {
            dispatch(clearFoodOverride(foodId));
            navigation.goBack();
          }}
        />
      ) : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginBottom: space.sm },
  note: { color: colors.inkSecondary, flex: 1 },
});

export default FoodEditScreen;
