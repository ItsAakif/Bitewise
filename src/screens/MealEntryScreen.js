import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { ALL_FOODS } from '../data';
import { resolvePortion } from '../utils/portions';
import { hasMicros } from '../data/micros';
import { applyOverrides } from '../utils/foodOverrides';
import { searchFoods, foodIcon } from '../utils/catalog';
import { parseFoodText } from '../utils/parseFoodText';
import { scaleFood, requantify, sumItems } from '../utils/nutrition';
import { addMeal, markTemplateUsed } from '../redux/slices/nutritionSlice';
import { recentMeals } from '../utils/mealTemplates';

const SLOT_LABEL = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const MealEntryScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { mealType = 'lunch', initialFoodId } = route.params || {};
  const customFoods = useSelector((state) => state.nutrition.customFoods);
  const overrides = useSelector((state) => state.nutrition.foodOverrides);
  const catalogue = useMemo(
    () => [...customFoods, ...applyOverrides(ALL_FOODS, overrides)],
    [customFoods, overrides]
  );

  const [query, setQuery] = useState('');
  const [sentence, setSentence] = useState('');
  const [items, setItems] = useState(() => {
    if (!initialFoodId) return [];
    const seeded = catalogue.find((food) => food.id === initialFoodId);
    return seeded ? [scaleFood(seeded, 1, 0)] : [];
  });
  const templates = useSelector((state) => state.nutrition.mealTemplates) || [];
  const history = useSelector((state) => state.nutrition.history);
  const dailyLog = useSelector((state) => state.nutrition.dailyLog);
  const recents = useMemo(() => recentMeals(history, dailyLog, { limit: 4 }), [history, dailyLog]);
  const [notice, setNotice] = useState(null);

  const loadItems = (items, templateId) => {
    if (!items?.length) return;
    setItems(items.map((item, index) => ({ ...item, id: `${item.id || item.foodId || 'item'}-load-${index}` })));
    if (templateId) dispatch(markTemplateUsed(templateId));
  };
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: '', serving: '1 serving', calories: '', protein: '', carbs: '', fat: '' });

  const results = useMemo(() => {
    if (!query.trim()) return catalogue.slice(0, 8);
    return searchFoods(query, {}, catalogue).slice(0, 20);
  }, [query, catalogue]);

  // Everything is weighed: one catalogue serving, which the data states in grams.
  const addFood = (food) => {
    const portion = resolvePortion({ food, count: 1 });
    setItems((current) => {
      const item = scaleFood(food, portion.quantity, current.length);
      return [...current, { ...item, portionLabel: portion.label, grams: portion.grams }];
    });
    setNotice(null);
  };

  const matchSentence = () => {
    const parsed = parseFoodText(sentence, catalogue);
    if (!parsed) {
      setNotice('Nothing in the catalogue matched that. Try naming the food directly.');
      return;
    }
    setItems((current) => [
      ...current,
      ...parsed.map((item, index) => scaleFood(item, item.quantity, current.length + index)),
    ]);
    setSentence('');
    setNotice(null);
  };

  const addCustom = () => {
    const calories = Number(custom.calories);
    if (!custom.name.trim() || !Number.isFinite(calories) || calories <= 0) {
      setNotice('A custom food needs a name and calories.');
      return;
    }
    const food = {
      id: `custom-${Date.now()}`,
      name: custom.name.trim(),
      serving: custom.serving.trim() || '1 serving',
      calories,
      protein: Number(custom.protein) || 0,
      carbs: Number(custom.carbs) || 0,
      fat: Number(custom.fat) || 0,
      category: 'prepared',
      tags: ['custom'],
      diet: [],
    };
    addFood(food);
    setCustom({ name: '', serving: '1 serving', calories: '', protein: '', carbs: '', fat: '' });
    setShowCustom(false);
  };

  const totals = sumItems(items);
  const canSave = items.length > 0;

  const save = () => {
    if (!canSave) return;
    dispatch(addMeal({ type: mealType, items }));
    navigation.goBack();
  };

  return (
    <ScreenScaffold
      title={`Add to ${SLOT_LABEL[mealType] || 'meal'}`}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={canSave ? `Save ${Math.round(totals.calories)} kcal` : 'Add at least one food'}
          onPress={save}
          disabled={!canSave}
          fullWidth
        />
      }
    >
      {templates.length || recents.length ? (
        <Card>
          <Text style={[typography.label, styles.sectionLabel]}>Log it again</Text>

          {templates.slice(0, 4).map((template) => (
            <Pressable
              key={template.id}
              onPress={() => loadItems(template.items, template.id)}
              accessibilityRole="button"
              accessibilityLabel={`Load ${template.name}`}
              style={({ pressed }) => [styles.reuseRow, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="star-outline" size={iconSize.md} color={colors.accent} />
              <View style={styles.reuseText}>
                <Text style={[typography.body, styles.resultName]} numberOfLines={1}>
                  {template.name}
                </Text>
                <Text style={[typography.caption, styles.resultMeta]}>
                  {Math.round(template.total?.calories || 0)} kcal · saved meal
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-left-top" size={iconSize.sm} color={colors.inkTertiary} />
            </Pressable>
          ))}

          {recents.slice(0, 3).map((recent) => (
            <Pressable
              key={recent.key}
              onPress={() => loadItems(recent.items)}
              accessibilityRole="button"
              accessibilityLabel={`Repeat the meal from ${recent.date}`}
              style={({ pressed }) => [styles.reuseRow, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="history" size={iconSize.md} color={colors.inkSecondary} />
              <View style={styles.reuseText}>
                <Text style={[typography.body, styles.resultName]} numberOfLines={1}>
                  {recent.items.map((item) => item.name).slice(0, 2).join(', ')}
                  {recent.items.length > 2 ? ` +${recent.items.length - 2}` : ''}
                </Text>
                <Text style={[typography.caption, styles.resultMeta]}>
                  {Math.round(recent.total?.calories || 0)} kcal · {recent.date}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-left-top" size={iconSize.sm} color={colors.inkTertiary} />
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card>
        <Input
          label="Search the catalogue"
          value={query}
          onChangeText={setQuery}
          placeholder="Chicken, oats, banana…"
        />
        {results.length === 0 ? (
          <Text style={[typography.caption, styles.note]}>
            No match. Add it as a custom food below.
          </Text>
        ) : (
          results.map((food, index) => (
            <View key={food.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                onPress={() => addFood(food)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${food.name}`}
                style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons
                  name={foodIcon(food)}
                  size={iconSize.md}
                  color={colors.inkSecondary}
                />
                <View style={styles.resultText}>
                  <Text style={[typography.body, styles.resultName]} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={[typography.caption, styles.resultMeta]}>
                    {food.serving} · {food.calories} kcal
                    {hasMicros(food.micros) ? ' · micros' : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons name="plus" size={iconSize.md} color={colors.accent} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={[typography.label, styles.label]}>Describe what you ate</Text>
        <Input
          value={sentence}
          onChangeText={setSentence}
          placeholder="2 eggs and a coffee"
          helper="Matched against the catalogue. It will not invent a food."
        />
        <Button label="Match" variant="secondary" onPress={matchSentence} disabled={!sentence.trim()} />
      </Card>

      {showCustom ? (
        <Card>
          <Text style={[typography.label, styles.label]}>Custom food</Text>
          <Input label="Name" value={custom.name} onChangeText={(v) => setCustom((c) => ({ ...c, name: v }))} autoCapitalize="words" />
          <Input label="Serving" value={custom.serving} onChangeText={(v) => setCustom((c) => ({ ...c, serving: v }))} />
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Input label="Calories" value={custom.calories} onChangeText={(v) => setCustom((c) => ({ ...c, calories: v }))} keyboardType="numeric" />
            </View>
            <View style={styles.gridItem}>
              <Input label="Protein g" value={custom.protein} onChangeText={(v) => setCustom((c) => ({ ...c, protein: v }))} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Input label="Carbs g" value={custom.carbs} onChangeText={(v) => setCustom((c) => ({ ...c, carbs: v }))} keyboardType="numeric" />
            </View>
            <View style={styles.gridItem}>
              <Input label="Fat g" value={custom.fat} onChangeText={(v) => setCustom((c) => ({ ...c, fat: v }))} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowButtons}>
            <Button label="Add" onPress={addCustom} />
            <Button label="Cancel" variant="ghost" onPress={() => setShowCustom(false)} />
          </View>
        </Card>
      ) : (
        <Button label="Add a custom food" variant="secondary" icon="pencil-plus-outline" onPress={() => setShowCustom(true)} />
      )}

      <Card>
        <Text style={[typography.label, styles.label]}>
          In this meal · {Math.round(totals.calories)} kcal
        </Text>
        {items.length === 0 ? (
          <EmptyState
            icon="silverware-fork-knife"
            title="Nothing added yet"
            body="Search, describe a meal, or add a custom food."
          />
        ) : (
          items.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.itemRow}>
                <View style={styles.resultText}>
                  <Text style={[typography.body, styles.resultName]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[typography.caption, styles.resultMeta]}>
                    {item.portionLabel || `${item.quantity} × ${item.serving}`}
                    {item.grams ? ` · ${Math.round(item.grams)} g` : ''} ·{' '}
                    {Math.round(item.calories)} kcal
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    setItems((current) =>
                      current.map((row, i) =>
                        i === index ? requantify(row, Math.max(0.5, row.quantity - 0.5)) : row
                      )
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${item.name}`}
                  style={styles.step}
                >
                  <MaterialCommunityIcons name="minus" size={iconSize.sm} color={colors.ink} />
                </Pressable>
                <Pressable
                  onPress={() =>
                    setItems((current) =>
                      current.map((row, i) =>
                        i === index ? requantify(row, row.quantity + 0.5) : row
                      )
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${item.name}`}
                  style={styles.step}
                >
                  <MaterialCommunityIcons name="plus" size={iconSize.sm} color={colors.ink} />
                </Pressable>
                <Pressable
                  onPress={() => setItems((current) => current.filter((_, i) => i !== index))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                  style={styles.step}
                >
                  <MaterialCommunityIcons name="close" size={iconSize.sm} color={colors.inkTertiary} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </Card>

      {notice ? <Text style={[typography.caption, styles.notice]}>{notice}</Text> : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  note: { color: colors.inkTertiary, marginTop: space.sm },
  notice: { color: colors.danger },
  sectionLabel: { color: colors.inkSecondary, marginBottom: space.xs },
  reuseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  reuseText: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: colors.line },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  pressed: { opacity: 0.6 },
  resultText: { flex: 1, gap: 2 },
  resultName: { color: colors.ink },
  resultMeta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  label: { color: colors.inkSecondary, marginBottom: space.xs },
  grid: { flexDirection: 'row', gap: space.sm },
  gridItem: { flex: 1 },
  rowButtons: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
  },
  step: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
  },
});

export default MealEntryScreen;
