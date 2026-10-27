import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Chip from '../components/Chip';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { RECIPES, RECIPE_TAGS, DIET_TAGS } from '../data';
import { recipeIcon } from '../utils/catalog';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';

const FILTER_TAGS = RECIPE_TAGS.filter((tag) =>
  ['breakfast', 'lunch', 'dinner', 'snack', 'high-protein', 'low-carb', 'quick', 'batch-cook'].includes(tag)
);

const RecipesScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);
  const [diet, setDiet] = useState([]);
  const saved = useSelector((state) => state.recipe.customized);
  const imported = useSelector((state) => state.recipe.imported || []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECIPES.filter((recipe) => {
      if (tag && !recipe.tags.includes(tag)) return false;
      if (diet.length && !diet.every((d) => recipe.diet.includes(d))) return false;
      if (!q) return true;
      return (
        recipe.name.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.includes(q))
      );
    });
  }, [query, tag, diet]);

  const toggleDiet = (value) =>
    setDiet((current) =>
      current.includes(value) ? current.filter((d) => d !== value) : [...current, value]
    );

  return (
    <ScreenScaffold
      title="Recipes"
      subtitle={`${RECIPES.length} in the catalogue`}
      onBack={() => navigation.goBack()}
      action={{
        icon: 'link-plus',
        label: 'Import a recipe',
        onPress: () => navigation.navigate('RecipeImport'),
      }}
    >
      <Input value={query} onChangeText={setQuery} placeholder="Search recipes" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" selected={tag === null} onPress={() => setTag(null)} />
        {FILTER_TAGS.map((value) => (
          <Chip key={value} label={value} selected={tag === value} onPress={() => setTag(value)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {DIET_TAGS.map((value) => (
          <Chip key={value} label={value} selected={diet.includes(value)} onPress={() => toggleDiet(value)} />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="silverware-clean"
            title="No recipe matched"
            body="Clear a filter or search a different word."
          />
        </Card>
      ) : (
        filtered.map((recipe) => (
          <Pressable
            key={recipe.id}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${recipe.name}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name={recipeIcon(recipe)} size={iconSize.lg} color={colors.inkSecondary} />
            <View style={styles.text}>
              <Text style={[typography.body, styles.name]} numberOfLines={1}>
                {recipe.name}
              </Text>
              <Text style={[typography.caption, styles.meta]} numberOfLines={2}>
                {recipe.calories} kcal · {recipe.protein} g protein · {recipe.minutes} min
              </Text>
              <View style={styles.tagRow}>
                {recipe.diet.slice(0, 2).map((value) => (
                  <Badge key={value} label={value} tone="muted" />
                ))}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={iconSize.md} color={colors.inkTertiary} />
          </Pressable>
        ))
      )}

      <Button
        label="Import a recipe from a link"
        variant="secondary"
        icon="link-plus"
        onPress={() => navigation.navigate('RecipeImport')}
      />

      {imported.length > 0 ? (
        <View>
          <SectionHeader title={`Imported · ${imported.length}`} />
          <Card padded={false}>
            <View style={styles.listPad}>
              {imported.map((recipe, index) => (
                <View key={recipe.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.importedRow}>
                    <View style={styles.text}>
                      <Text style={[typography.body, styles.name]} numberOfLines={1}>
                        {recipe.name}
                      </Text>
                      <Text style={[typography.caption, styles.meta]}>
                        {recipe.calories} kcal · {recipe.minutes} min
                        {recipe.estimated ? ' · estimated' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {saved.length > 0 ? (
        <Card>
          <Text style={[typography.label, styles.savedLabel]}>Customised recipes saved</Text>
          {saved.map((entry) => (
            <Text key={entry.id} style={[typography.caption, styles.savedItem]}>
              {entry.title} · {new Date(entry.createdAt).toLocaleDateString()}
            </Text>
          ))}
        </Card>
      ) : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: space.xs },
  name: { color: colors.ink },
  meta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  tagRow: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  listPad: { paddingHorizontal: space.base },
  importedRow: { paddingVertical: space.sm },
  savedLabel: { color: colors.inkSecondary, marginBottom: space.xs },
  savedItem: { color: colors.inkSecondary, paddingVertical: 2 },
});

export default RecipesScreen;
