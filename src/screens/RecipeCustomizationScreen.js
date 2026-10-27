import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { RECIPES } from '../data/recipes';
import { customizeRecipe, saveCustomized, clearError } from '../redux/slices/recipeSlice';

const TARGET_DIETS = ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'low-carb'];

const RecipeCustomizationScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { available, loading, error, customized } = useSelector((state) => state.recipe);
  const initialRecipe = useMemo(
    () => RECIPES.find((r) => r.id === route.params?.recipeId),
    [route.params]
  );

  const [selectedId, setSelectedId] = useState(initialRecipe?.id || RECIPES[0]?.id);
  const [diet, setDiet] = useState('vegetarian');
  const recipe = RECIPES.find((r) => r.id === selectedId);

  const recipeText = recipe
    ? [
        recipe.name,
        '',
        'Ingredients:',
        ...recipe.ingredients.map((i) => `- ${i.quantity} ${i.unit} ${i.name}`),
        '',
        'Method:',
        ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
      ].join('\n')
    : '';

  const latest = customized[0];

  const run = () => {
    dispatch(clearError());
    dispatch(customizeRecipe({ recipeText, targetDiet: diet }));
  };

  return (
    <ScreenScaffold
      title="Customise a recipe"
      subtitle="Rewrites a recipe for a different diet"
      onBack={() => navigation.goBack()}
    >
      {!available ? (
        <Card>
          <EmptyState
            icon="server-off"
            title="Not connected"
            body="Rewriting a recipe needs a language model on a server. This build has no endpoint configured, so the feature is off rather than pretending."
          />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={[typography.label, styles.label]}>Base recipe</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {RECIPES.map((option) => (
                <Chip
                  key={option.id}
                  label={option.name}
                  selected={option.id === selectedId}
                  onPress={() => setSelectedId(option.id)}
                />
              ))}
            </ScrollView>

            <Text style={[typography.label, styles.label]}>Rewrite as</Text>
            <View style={styles.wrapRow}>
              {TARGET_DIETS.map((value) => (
                <Chip key={value} label={value} selected={diet === value} onPress={() => setDiet(value)} />
              ))}
            </View>

            <Button label="Rewrite recipe" onPress={run} loading={loading} fullWidth />
          </Card>

          {error ? (
            <Card>
              <ErrorMessage message={error} onRetry={run} />
            </Card>
          ) : null}

          {latest ? (
            <Card>
              <View style={styles.resultHeader}>
                <Text style={[typography.heading, styles.sectionTitle]}>Result</Text>
                <Badge label={diet} />
              </View>
              <Text style={[typography.body, styles.resultBody]}>{String(latest.body)}</Text>
              <Button
                label="Save to my recipes"
                variant="secondary"
                onPress={() =>
                  dispatch(saveCustomized({ title: `${recipe?.name || 'Recipe'} (${diet})`, body: latest.body }))
                }
              />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="text-box-edit-outline"
                title="No rewrite yet"
                body="Pick a recipe and a diet, then run it. The server returns the rewritten text."
              />
            </Card>
          )}
        </>
      )}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.inkSecondary, marginTop: space.sm, marginBottom: space.xs },
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.base },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  sectionTitle: { color: colors.ink },
  resultBody: { color: colors.ink, marginBottom: space.md },
});

export default RecipeCustomizationScreen;
