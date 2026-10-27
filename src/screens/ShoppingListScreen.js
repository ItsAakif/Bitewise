import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { RECIPES } from '../data/recipes';
import { buildShoppingList } from '../utils/mealPlan';
import { toggleShoppingItem, clearShopping } from '../redux/slices/mealSlice';

const recipesById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

const ShoppingListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const plan = useSelector((state) => state.meal.plan);
  const checked = useSelector((state) => state.meal.shoppingChecked) || [];

  const items = useMemo(() => buildShoppingList(plan, recipesById), [plan]);
  const remaining = items.filter((item) => !checked.includes(item.key)).length;

  if (!plan || items.length === 0) {
    return (
      <ScreenScaffold title="Shopping list" onBack={() => navigation.goBack()}>
        <Card>
          <EmptyState
            icon="cart-outline"
            title="No plan to shop for"
            body="Build a week plan first — the list is generated from the ingredients of the recipes you picked."
            action={{ label: 'Open meal plan', onPress: () => navigation.navigate('MealPlanning') }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title="Shopping list"
      subtitle={`${items.length} ingredients · ${remaining} still to get`}
      onBack={() => navigation.goBack()}
      action={checked.length ? { icon: 'broom', label: 'Clear ticks', onPress: () => dispatch(clearShopping()) } : undefined}
    >
      <Card>
        <Text style={[typography.caption, styles.note]}>
          Every ingredient in this week&apos;s plan, combined. Quantities only add up when the unit
          matches, so nothing is silently merged across grams and spoons.
        </Text>
      </Card>

      <Card padded={false}>
        {items.map((item, index) => {
          const done = checked.includes(item.key);
          return (
            <View key={item.key}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                onPress={() => dispatch(toggleShoppingItem(item.key))}
                accessibilityRole="checkbox"
                accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}`}
                accessibilityState={{ checked: done }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={[styles.tick, done && styles.tickOn]}>
                  {done ? (
                    <MaterialCommunityIcons name="check" size={iconSize.sm} color={colors.onAccent} />
                  ) : null}
                </View>
                <View style={styles.rowText}>
                  <Text style={[typography.body, styles.name, done && styles.nameDone]}>
                    {item.name}
                  </Text>
                  <Text style={[typography.caption, styles.meta]}>
                    {item.recipes.length === 1
                      ? item.recipes[0]
                      : `${item.recipes.length} recipes`}
                  </Text>
                </View>
                <Text style={[typography.body, styles.qty, done && styles.nameDone]}>
                  {item.quantity} {item.unit}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <View style={styles.footerRow}>
        <Badge label={`${checked.length} of ${items.length} picked up`} tone={remaining === 0 ? 'accent' : 'muted'} />
      </View>

      <Button
        label="Back to the plan"
        variant="secondary"
        onPress={() => navigation.navigate('MealPlanning')}
        fullWidth
      />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  note: { color: colors.inkSecondary },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: space.base + 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    minHeight: 56,
  },
  pressed: { opacity: 0.65 },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.ink },
  nameDone: { color: colors.inkTertiary, textDecorationLine: 'line-through' },
  meta: { color: colors.inkTertiary },
  qty: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  footerRow: { flexDirection: 'row' },
});

export default ShoppingListScreen;
