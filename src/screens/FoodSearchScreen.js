import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import { ALL_FOODS } from '../data';
import { FOOD_CATEGORIES, DIET_TAGS } from '../data/foods';
import { searchFoods, foodIcon } from '../utils/catalog';
import { applyOverrides } from '../utils/foodOverrides';
import { toggleFavorite } from '../redux/slices/nutritionSlice';

const SEARCH_LIMIT = 40;

const FoodSearchScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const mealType = route.params?.mealType || 'snack';
  const favourites = useSelector((state) => state.nutrition.favorites);
  const customFoods = useSelector((state) => state.nutrition.customFoods);
  const overrides = useSelector((state) => state.nutrition.foodOverrides);
  const catalogue = useMemo(
    () => [...customFoods, ...applyOverrides(ALL_FOODS, overrides)],
    [customFoods, overrides]
  );

  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState([]);
  const [category, setCategory] = useState(null);

  const results = useMemo(
    () => searchFoods(query, { diet, category }, catalogue).slice(0, SEARCH_LIMIT),
    [query, diet, category, catalogue]
  );

  const favouriteFoods = catalogue.filter((food) => favourites.includes(food.id));

  const toggleDiet = (tag) =>
    setDiet((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );

  const openFood = (food) =>
    navigation.navigate('MealEntry', { mealType, initialFoodId: food.id });

  const renderFood = (food, index, list) => {
    const isFavourite = favourites.includes(food.id);
    return (
      <View key={food.id}>
        {index > 0 ? <View style={styles.divider} /> : null}
        <View style={styles.row}>
          <Pressable
            onPress={() => openFood(food)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${food.name} to ${mealType}`}
            style={styles.rowMain}
          >
            <MaterialCommunityIcons name={foodIcon(food)} size={iconSize.md} color={colors.inkSecondary} />
            <View style={styles.rowText}>
              <Text style={[typography.body, styles.name]} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={[typography.caption, styles.meta]}>
                {food.serving} · {food.calories} kcal · {food.protein} g protein
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('FoodEdit', { foodId: food.id })}
            accessibilityRole="button"
            accessibilityLabel={`Edit the values for ${food.name}`}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="pencil-outline" size={iconSize.md} color={colors.inkTertiary} />
          </Pressable>
          <Pressable
            onPress={() => dispatch(toggleFavorite(food.id))}
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? `Remove ${food.name} from favourites` : `Save ${food.name} to favourites`}
            accessibilityState={{ selected: isFavourite }}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={iconSize.md}
              color={isFavourite ? colors.accent : colors.inkTertiary}
            />
          </Pressable>
          <Pressable
            onPress={() => openFood(food)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${food.name}`}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="plus" size={iconSize.md} color={colors.accent} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenScaffold
      title="Find a food"
      subtitle={`${catalogue.length} foods and Indian dishes`}
      onBack={() => navigation.goBack()}
      action={{
        icon: 'barcode-scan',
        label: 'Scan a barcode',
        onPress: () => navigation.navigate('BarcodeScan', { mealType }),
      }}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search 60+ foods"
        right={
          query ? (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={iconSize.sm} color={colors.inkTertiary} />
            </Pressable>
          ) : null
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {DIET_TAGS.map((tag) => (
          <Chip key={tag} label={tag} selected={diet.includes(tag)} onPress={() => toggleDiet(tag)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {FOOD_CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </ScrollView>

      <Button
        label="Not here? Read the label"
        variant="secondary"
        icon="barcode-scan"
        onPress={() => navigation.navigate('LabelEntry')}
      />

      {!query && favouriteFoods.length > 0 ? (
        <View>
          <SectionHeader title="Favourites" />
          <Card>{favouriteFoods.map(renderFood)}</Card>
        </View>
      ) : null}

      <View>
        <SectionHeader title={query ? `${results.length} results` : 'Catalogue'} />
        <Card>
          {results.length === 0 ? (
            <EmptyState
              icon="magnify"
              title="No food matched"
              body="Try a shorter word, or clear the filters. You can add a custom food from the diary."
            />
          ) : (
            results.map(renderFood)
          )}
        </Card>
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  divider: { height: 1, backgroundColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.ink },
  meta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
});

export default FoodSearchScreen;
