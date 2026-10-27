import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Button from '../components/Button';
import ListRow from '../components/ListRow';
import EmptyState from '../components/EmptyState';
import StatRow from '../components/StatRow';
import DailyMealPlan from '../components/meal/DailyMealPlan';
import { RECIPES } from '../data/recipes';
import { generatePlan } from '../redux/slices/mealSlice';
import { planTotals } from '../utils/mealPlan';
import { startOfWeekISO, formatDayLabel, todayISO, addDays } from '../utils/date';

const recipesById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

const MealPlanningScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const plan = useSelector((state) => state.meal.plan);
  const targets = useSelector((state) => state.user.targets);
  const diet = useSelector((state) => state.user.preferences.diet);

  const regenerate = (weekStart) =>
    dispatch(generatePlan({ weekStart, calorieTarget: targets.calories, diet }));

  useEffect(() => {
    if (!plan) regenerate(startOfWeekISO(todayISO()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => planTotals(plan, recipesById), [plan]);

  return (
    <ScreenScaffold
      title="Meal plan"
      subtitle={plan ? `Week of ${formatDayLabel(plan.weekStart)}` : undefined}
      onBack={() => navigation.goBack()}
    >
      {!plan ? (
        <Card>
          <EmptyState
            icon="calendar-week"
            title="No plan yet"
            body="Build a week from the recipe catalogue using your calorie target."
            action={{ label: 'Build this week', onPress: () => regenerate(startOfWeekISO(todayISO())) }}
          />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={[typography.label, styles.label]}>Daily average from the plan</Text>
            <StatRow label="Calories" value={totals.average.calories} target={targets.calories} />
            <StatRow label="Protein" value={`${totals.average.protein} g`} target={`${targets.protein} g`} />
            <StatRow label="Carbs" value={`${totals.average.carbs} g`} target={`${targets.carbs} g`} />
            <StatRow label="Fat" value={`${totals.average.fat} g`} target={`${targets.fat} g`} />
            <View style={styles.buttonRow}>
              <Button
                label="Next week"
                variant="secondary"
                onPress={() => regenerate(addDays(plan.weekStart, 7))}
              />
              <Button
                label="Rebuild"
                variant="ghost"
                onPress={() => regenerate(plan.weekStart)}
              />
            </View>
          </Card>

          <Card padded={false}>
            <View style={styles.listPad}>
              <ListRow
                icon="cart-outline"
                title="Shopping list"
                subtitle="Every ingredient in this week's plan, combined"
                onPress={() => navigation.navigate('ShoppingList')}
              />
            </View>
          </Card>

          <DailyMealPlan
            plan={plan}
            recipesById={recipesById}
            onOpenRecipe={(recipeId) => navigation.navigate('RecipeDetail', { recipeId })}
          />
        </>
      )}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.inkSecondary, marginBottom: space.xs },
  buttonRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  listPad: { paddingHorizontal: space.base, paddingVertical: space.xs },
});

export default MealPlanningScreen;
