import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Segmented from '../components/Segmented';
import EmptyState from '../components/EmptyState';
import { buildInsights, INSIGHTS_CAVEAT } from '../utils/insights';
import { ALL_FOODS } from '../data';

const WINDOWS = [
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];

const TONE = {
  watch: { badge: 'Worth a look', tone: 'muted' },
  good: { badge: 'Going well', tone: 'accent' },
  info: { badge: 'Context', tone: 'muted' },
};

const InsightsScreen = ({ navigation }) => {
  const history = useSelector((state) => state.nutrition.history);
  const dailyLog = useSelector((state) => state.nutrition.dailyLog);
  const targets = useSelector((state) => state.user.targets);
  const [windowDays, setWindowDays] = useState(21);

  const result = useMemo(
    () => buildInsights({ history, dailyLog, targets, foods: ALL_FOODS, windowDays }),
    [history, dailyLog, targets, windowDays]
  );

  return (
    <ScreenScaffold
      title="Insights"
      subtitle={`${result.daysWithRecords} logged day${result.daysWithRecords === 1 ? '' : 's'} in ${windowDays} days`}
      onBack={() => navigation.goBack()}
    >
      <Segmented options={WINDOWS} value={windowDays} onChange={setWindowDays} />

      {result.insights.length === 0 ? (
        <Card>
          <EmptyState
            icon="chart-box-outline"
            title="Nothing to report yet"
            body="Insights appear once there are a few days of food logged."
          />
        </Card>
      ) : (
        result.insights.map((insight) => {
          const tone = TONE[insight.tone] || TONE.info;
          return (
            <Card key={insight.id}>
              <View style={styles.headerRow}>
                <Text style={[typography.heading, styles.title]}>{insight.title}</Text>
                <Badge label={tone.badge} tone={tone.tone} />
              </View>
              <Text style={[typography.body, styles.detail]}>{insight.detail}</Text>

              <View style={styles.evidenceBox}>
                <Text style={[typography.caption, styles.evidenceLabel]}>How this was worked out</Text>
                <Text style={[typography.caption, styles.evidence]}>{insight.evidence}</Text>
              </View>

              {insight.suggestion?.foods?.length ? (
                <View style={styles.suggestions}>
                  <Text style={[typography.caption, styles.evidenceLabel]}>
                    {insight.suggestion.label}
                  </Text>
                  {insight.suggestion.foods.map((food) => (
                    <Text key={food.id} style={[typography.caption, styles.suggestion]}>
                      · {food.name} — {food.amount} {food.unit} per serving
                    </Text>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <Text style={[typography.caption, styles.caveat]}>{INSIGHTS_CAVEAT}</Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginBottom: space.xs },
  title: { color: colors.ink, flex: 1 },
  detail: { color: colors.inkSecondary },
  evidenceBox: {
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 2,
  },
  evidenceLabel: { color: colors.inkTertiary },
  evidence: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  suggestions: { marginTop: space.sm, gap: 2 },
  suggestion: { color: colors.inkSecondary },
  caveat: { color: colors.inkTertiary, paddingHorizontal: space.xs },
});

export default InsightsScreen;
