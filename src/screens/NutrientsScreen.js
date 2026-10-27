import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Meter from '../components/Meter';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import {
  MICRO_GOALS,
  MICRO_LIMITS,
  MICRO_LABELS,
  MICRO_UNITS,
} from '../data/micros';
import { rdaDescription } from '../data/indianRda';
import { microsCoverage } from '../utils/nutrition';

const NutrientsScreen = ({ navigation }) => {
  const micros = useSelector((state) => state.nutrition.dailyLog.micros) || {};
  const items = useSelector((state) => state.nutrition.dailyLog.meals.flatMap((m) => m.items || []));
  const targets = useSelector((state) => state.user.targets.micros) || {};
  const stats = useSelector((state) => state.user.stats);

  const coverage = microsCoverage(items);
  const known = MICRO_GOALS.filter((key) => Number(micros[key]) > 0 || Number(targets[key]) > 0);

  return (
    <ScreenScaffold
      title="Micronutrients"
      subtitle={rdaDescription({ sex: stats.sex, age: stats.age })}
      onBack={() => navigation.goBack()}
    >
      <Card>
        <Text style={[typography.body, styles.intro]}>
          Targets below are the Indian reference intakes, not American ones. Calcium is
          1,000 mg and iron 29 mg for women — both higher than the values most apps use.
        </Text>
        <View style={styles.badgeRow}>
          <Badge label={`${Math.round(coverage * 100)}% of items have micro data`} tone={coverage > 0.5 ? 'accent' : 'muted'} />
        </View>
        {coverage < 1 ? (
          <Text style={[typography.caption, styles.note]}>
            Some foods in the catalogue have no micronutrient figures yet. A blank row means
            unknown, not zero.
          </Text>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Reach these" />
        {known.length === 0 ? (
          <EmptyState
            icon="food-apple-outline"
            title="Nothing logged yet"
            body="Micronutrients appear once you log food that carries them."
          />
        ) : (
          MICRO_GOALS.map((key) => {
            const value = Number(micros[key]) || 0;
            const target = Number(targets[key]) || 0;
            if (!target && !value) return null;
            return (
              <Meter
                key={key}
                label={`${MICRO_LABELS[key]} (${MICRO_UNITS[key]})`}
                value={value}
                target={target}
                tone="accent"
              />
            );
          })
        )}
      </Card>

      <Card>
        <SectionHeader title="Stay under" />
        {MICRO_LIMITS.map((key) => {
          const value = Number(micros[key]) || 0;
          const limit = Number(targets[key]) || 0;
          const over = limit > 0 && value > limit;
          return (
            <View key={key} style={styles.limitRow}>
              <Text style={[typography.body, styles.limitLabel]}>
                {MICRO_LABELS[key]} ({MICRO_UNITS[key]})
              </Text>
              <Text style={[typography.body, styles.limitValue, over && styles.over]}>
                {Math.round(value)} / {Math.round(limit)}
              </Text>
            </View>
          );
        })}
        <Text style={[typography.caption, styles.note]}>
          Limits are reference upper values, not a daily target to fill.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Where these come from" />
        <Text style={[typography.caption, styles.note]}>
          ICMR-NIN Recommended Dietary Allowances for Indians (2020). They are population
          figures, not a personal prescription. Adjust them in Settings if a clinician has
          given you different numbers.
        </Text>
        <Text style={[typography.caption, styles.link]} onPress={() => navigation.navigate('Settings')}>
          Open targets in Settings
        </Text>
      </Card>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  intro: { color: colors.ink, marginBottom: space.sm },
  badgeRow: { flexDirection: 'row', marginBottom: space.xs },
  note: { color: colors.inkSecondary, marginTop: space.xs },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  limitLabel: { color: colors.inkSecondary },
  limitValue: { color: colors.ink, fontVariant: ['tabular-nums'] },
  over: { color: colors.danger },
  link: { color: colors.accent, marginTop: space.sm },
});

export default NutrientsScreen;
