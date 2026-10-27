import React, { useState } from 'react';
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
import { addCustomFood } from '../redux/slices/nutritionSlice';
import { MICRO_GOALS, MICRO_LABELS, MICRO_UNITS } from '../data/micros';

// The FSSAI nutrition panel has a fixed order: energy, protein, carbohydrate
// (with sugar specified), fat, then any nutrient that carries a claim. The form
// follows that order so entering a label is a straight read down the packet.
const PANEL_ORDER = ['fiber', 'sugar', 'sodium', 'calcium', 'iron', 'vitaminC'];

const LabelEntryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const customFoods = useSelector((state) => state.nutrition.customFoods);

  const [form, setForm] = useState({
    name: '',
    serving: '100 g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    vitaminC: 0,
  });
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(null);

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.name.trim()) {
      setNotice('Give the food a name, as it appears on the packet.');
      return;
    }
    if (!form.calories) {
      setNotice('Energy is required — it is the first line on every nutrition panel.');
      return;
    }

    const micros = {};
    for (const key of Object.keys(form)) {
      if (MICRO_GOALS.includes(key) && Number(form[key]) > 0) micros[key] = Number(form[key]);
    }
    if (Number(form.sugar) > 0) micros.sugar = Number(form.sugar);
    if (Number(form.sodium) > 0) micros.sodium = Number(form.sodium);

    const duplicate = customFoods.find(
      (food) => food.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) {
      setNotice(`"${form.name.trim()}" is already in your foods. Rename it to keep both.`);
      return;
    }

    const food = {
      id: `label-${Date.now()}`,
      name: form.name.trim(),
      serving: form.serving.trim() || '100 g',
      calories: Math.round(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      category: 'prepared',
      kind: 'ingredient',
      tags: ['packaged', 'label'],
      diet: [],
      micros: Object.keys(micros).length ? micros : undefined,
      source: { id: 'label', name: 'Read from a nutrition label', licence: 'user entry' },
    };

    dispatch(addCustomFood(food));
    setSaved(food);
    setNotice(null);
  };

  if (saved) {
    return (
      <ScreenScaffold title="Saved" onBack={() => navigation.goBack()}>
        <Card>
          <Text style={[typography.heading, styles.heading]}>{saved.name}</Text>
          <Text style={[typography.body, styles.macros]}>
            {saved.calories} kcal · {saved.protein} g protein · {saved.carbs} g carbs ·{' '}
            {saved.fat} g fat
          </Text>
          <Text style={[typography.caption, styles.note]}>per {saved.serving}</Text>
          <View style={styles.actions}>
            <Button
              label="Log it now"
              onPress={() => navigation.replace('MealEntry', { mealType: 'snack', initialFoodId: saved.id })}
            />
            <Button
              label="Add another"
              variant="ghost"
              onPress={() => {
                setSaved(null);
                setForm((current) => ({ ...current, name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }));
              }}
            />
          </View>
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title="Read a label"
      subtitle="Type the values from the nutrition panel"
      onBack={() => navigation.goBack()}
    >
      <Card>
        <Text style={[typography.body, styles.intro]}>
          Indian packaged food carries a nutrition panel by law, in a fixed order. Copy the
          numbers exactly as printed — per 100 g or per serving, whichever the panel uses.
        </Text>
        <Badge label="Not in Open Food Facts? This is the way in." tone="muted" />
      </Card>

      <Card>
        <SectionHeader title="The food" />
        <Input
          label="Name on the packet"
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
          autoCapitalize="words"
          placeholder="Masala oats"
        />
        <Input
          label="Serving the panel refers to"
          value={form.serving}
          onChangeText={(value) => setForm((current) => ({ ...current, serving: value }))}
          placeholder="100 g or 40 g"
        />
      </Card>

      <Card>
        <SectionHeader title="Energy and macros" />
        <NumberField label="Energy" unit="kcal" value={form.calories} min={0} max={2000} step={5} onChange={set('calories')} />
        <NumberField label="Protein" unit="g" value={form.protein} min={0} max={200} step={0.5} onChange={set('protein')} />
        <NumberField label="Carbohydrate" unit="g" value={form.carbs} min={0} max={300} step={1} onChange={set('carbs')} />
        <NumberField label="of which sugar" unit="g" value={form.sugar} min={0} max={200} step={0.5} onChange={set('sugar')} />
        <NumberField label="Fat" unit="g" value={form.fat} min={0} max={200} step={0.5} onChange={set('fat')} />
      </Card>

      <Card>
        <SectionHeader title="Optional nutrients" />
        <Text style={[typography.caption, styles.note]}>
          Only fill what the panel actually prints. Blank means unknown, which is honest;
          zero would claim the food contains none.
        </Text>
        {PANEL_ORDER.map((key) => (
          <NumberField
            key={key}
            label={`${MICRO_LABELS[key]} (${MICRO_UNITS[key]})`}
            value={form[key]}
            min={0}
            max={key === 'sodium' ? 5000 : 2000}
            step={key === 'sodium' ? 10 : 1}
            onChange={set(key)}
          />
        ))}
      </Card>

      {notice ? <Text style={[typography.caption, styles.error]}>{notice}</Text> : null}

      <Button label="Save this food" onPress={save} fullWidth />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  intro: { color: colors.ink, marginBottom: space.sm },
  heading: { color: colors.ink, marginBottom: space.xs },
  macros: { color: colors.ink, fontVariant: ['tabular-nums'] },
  note: { color: colors.inkSecondary, marginBottom: space.sm },
  error: { color: colors.danger },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});

export default LabelEntryScreen;
