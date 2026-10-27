import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import ErrorMessage from '../components/common/ErrorMessage';
import { importRecipeFromUrl } from '../services/recipeImport';
import { addImported } from '../redux/slices/recipeSlice';

const RecipeImportScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const imported = await importRecipeFromUrl(url);
      setResult(imported);
      setStatus('done');
    } catch (e) {
      setError(e?.message || 'Could not import that recipe.');
      setStatus('error');
    }
  };

  const save = () => {
    if (!result?.recipe) return;
    dispatch(addImported(result.recipe));
    navigation.goBack();
  };

  const recipe = result?.recipe;

  return (
    <ScreenScaffold
      title="Import a recipe"
      subtitle="From a recipe page, using its structured data"
      onBack={() => navigation.goBack()}
    >
      <Card>
        <Input
          label="Recipe URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/rajma-recipe"
          helper="Works with sites that publish standard recipe markup."
        />
        <Button label="Import" onPress={run} loading={status === 'loading'} disabled={!url.trim()} />
      </Card>

      {error ? <ErrorMessage message={error} onRetry={run} /> : null}

      {status === 'done' && !recipe ? (
        <Card>
          <EmptyState
            icon="link-off"
            title="Nothing usable found"
            body="The page loaded but did not describe a recipe in a standard way."
          />
        </Card>
      ) : null}

      {recipe ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <Text style={[typography.heading, styles.name]}>{recipe.name}</Text>
              {recipe.estimated ? <Badge label="Estimated" tone="muted" /> : null}
            </View>
            {recipe.description ? (
              <Text style={[typography.caption, styles.description]}>{recipe.description}</Text>
            ) : null}
            <Text style={[typography.body, styles.macros]}>
              {recipe.calories} kcal · {recipe.protein} g protein · {recipe.carbs} g carbs ·{' '}
              {recipe.fat} g fat
            </Text>
            <Text style={[typography.caption, styles.meta]}>
              {recipe.minutes} min · {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
            </Text>
            {recipe.estimated ? (
              <Text style={[typography.caption, styles.warning]}>
                The page had no nutrition data, so these macros are summed from the ingredients
                we could match. Treat them as approximate.
              </Text>
            ) : null}
          </Card>

          <Card>
            <SectionHeader title={`Matched ${result.matched.length} of ${result.matched.length + result.unmatched.length}`} />
            {result.matched.map((entry) => (
              <View key={`${entry.foodId}-${entry.line}`} style={styles.ingredientRow}>
                <Text style={[typography.caption, styles.ingredientMatch]}>✓</Text>
                <Text style={[typography.caption, styles.ingredientText]}>{entry.line}</Text>
              </View>
            ))}
            {result.unmatched.length ? (
              <>
                <Text style={[typography.label, styles.unmatchedLabel]}>Not matched</Text>
                {result.unmatched.map((line) => (
                  <View key={line} style={styles.ingredientRow}>
                    <Text style={[typography.caption, styles.ingredientMiss]}>·</Text>
                    <Text style={[typography.caption, styles.ingredientText]}>{line}</Text>
                  </View>
                ))}
                <Text style={[typography.caption, styles.note]}>
                  Unmatched lines are kept as written. They are not counted in the nutrition
                  totals.
                </Text>
              </>
            ) : null}
          </Card>

          {recipe.steps.length ? (
            <Card>
              <SectionHeader title="Method" />
              {recipe.steps.map((step, index) => (
                <View key={`step-${index}`} style={styles.stepRow}>
                  <Text style={[typography.caption, styles.stepNumber]}>{index + 1}</Text>
                  <Text style={[typography.body, styles.stepText]}>{step}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={styles.actions}>
            <Button label="Save to my recipes" onPress={save} />
            <Button label="Discard" variant="ghost" onPress={() => setResult(null)} />
          </View>
        </>
      ) : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginBottom: space.xs },
  name: { color: colors.ink, flex: 1 },
  description: { color: colors.inkSecondary, marginBottom: space.sm },
  macros: { color: colors.ink, fontVariant: ['tabular-nums'] },
  meta: { color: colors.inkTertiary, marginTop: space.xs },
  warning: { color: colors.inkSecondary, marginTop: space.sm },
  ingredientRow: { flexDirection: 'row', gap: space.sm, paddingVertical: 2 },
  ingredientMatch: { color: colors.accent },
  ingredientMiss: { color: colors.inkTertiary },
  ingredientText: { color: colors.inkSecondary, flex: 1 },
  unmatchedLabel: { color: colors.inkSecondary, marginTop: space.sm, marginBottom: space.xs },
  note: { color: colors.inkTertiary, marginTop: space.xs },
  stepRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  stepNumber: { color: colors.inkTertiary, width: 16 },
  stepText: { color: colors.ink, flex: 1 },
  actions: { flexDirection: 'row', gap: space.sm },
});

export default RecipeImportScreen;
