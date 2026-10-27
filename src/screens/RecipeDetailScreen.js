import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { RECIPES } from '../data/recipes';
import { addMeal } from '../redux/slices/nutritionSlice';
import { scaleFood } from '../utils/nutrition';

const SLOT_FROM_TAGS = (recipe) => {
  if (recipe.tags.includes('breakfast')) return 'breakfast';
  if (recipe.tags.includes('lunch')) return 'lunch';
  if (recipe.tags.includes('dinner')) return 'dinner';
  return 'snack';
};

const RecipeDetailScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { recipeId } = route.params || {};
  const recipe = useMemo(() => RECIPES.find((r) => r.id === recipeId), [recipeId]);
  const [logged, setLogged] = useState(false);

  if (!recipe) {
    return (
      <ScreenScaffold title="Recipe" onBack={() => navigation.goBack()}>
        <Card>
          <EmptyState
            icon="help-circle-outline"
            title="Recipe not found"
            body="It may have been removed from the catalogue."
            action={{ label: 'Back to recipes', onPress: () => navigation.goBack() }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  const logThis = () => {
    const item = scaleFood(
      {
        id: recipe.id,
        name: recipe.name,
        serving: '1 serving',
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      },
      1,
      0
    );
    dispatch(addMeal({ type: SLOT_FROM_TAGS(recipe), items: [item] }));
    setLogged(true);
  };

  return (
    <ScreenScaffold title={recipe.name} subtitle={`${recipe.minutes} min · ${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`} onBack={() => navigation.goBack()}>
      <Card>
        <Text style={[typography.body, styles.description]}>{recipe.description}</Text>
        <View style={styles.tagRow}>
          <Badge label={`${recipe.calories} kcal`} />
          <Badge label={`${recipe.protein} g protein`} tone="muted" />
          <Badge label={recipe.difficulty} tone="muted" />
        </View>
        <View style={styles.macroRow}>
          <Text style={[typography.caption, styles.macro]}>Carbs {recipe.carbs} g</Text>
          <Text style={[typography.caption, styles.macro]}>Fat {recipe.fat} g</Text>
        </View>
      </Card>

      <Card>
        <Text style={[typography.heading, styles.sectionTitle]}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={`${ingredient.name}-${index}`} style={styles.ingredientRow}>
            <Text style={[typography.body, styles.ingredientName]}>{ingredient.name}</Text>
            <Text style={[typography.caption, styles.ingredientQty]}>
              {ingredient.quantity} {ingredient.unit}
            </Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[typography.heading, styles.sectionTitle]}>Method</Text>
        {recipe.steps.map((step, index) => (
          <View key={`step-${index}`} style={styles.stepRow}>
            <Text style={[typography.caption, styles.stepNumber]}>{index + 1}</Text>
            <Text style={[typography.body, styles.stepText]}>{step}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          label={logged ? 'Logged to diary' : 'Log this recipe'}
          icon={logged ? 'check' : 'plus'}
          onPress={logThis}
          disabled={logged}
        />
        <Button
          label="Customise"
          variant="secondary"
          onPress={() => navigation.navigate('RecipeCustomization', { recipeId: recipe.id })}
        />
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  description: { color: colors.ink, marginBottom: space.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  macroRow: { flexDirection: 'row', gap: space.base, marginTop: space.sm },
  macro: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  sectionTitle: { color: colors.ink, marginBottom: space.sm },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ingredientName: { color: colors.ink, flex: 1 },
  ingredientQty: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  stepRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  stepNumber: { color: colors.inkTertiary, width: 16 },
  stepText: { color: colors.ink, flex: 1 },
  actions: { flexDirection: 'row', gap: space.sm, borderRadius: radius.md },
});

export default RecipeDetailScreen;
