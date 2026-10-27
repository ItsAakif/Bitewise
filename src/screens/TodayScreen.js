import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import SectionHeader from '../components/SectionHeader';
import Card from '../components/Card';
import Meter from '../components/Meter';
import DailyProgressCard from '../components/DailyProgressCard';
import WaterTrackerCard from '../components/WaterTrackerCard';
import RecentMealsCard from '../components/RecentMealsCard';
import HistoryStrip from '../components/HistoryStrip';
import { greeting, formatLongDate, todayISO } from '../utils/date';
import { percent, seriesFromHistory, streakFromHistory } from '../utils/nutrition';
import { healthScore, SCORE_BAND_LABELS } from '../utils/score';
import { fastingWindow, formatDuration } from '../utils/fasting';

const ACTIONS = [
  { key: 'add', label: 'Add food', icon: 'plus-circle-outline' },
  { key: 'scan', label: 'Scan', icon: 'barcode-scan', route: 'BarcodeScan' },
  { key: 'stats', label: 'Stats', icon: 'chart-timeline-variant', route: 'Stats' },
  { key: 'coach', label: 'Coach', icon: 'chat-processing-outline', route: 'Coach' },
];

const DEFAULT_CARDS = ['score', 'calories', 'fasting', 'macros', 'water', 'history', 'meals'];

const TodayScreen = ({ navigation }) => {
  const { dailyLog, history } = useSelector((state) => state.nutrition);
  const targets = useSelector((state) => state.user.targets);
  const name = useSelector((state) => state.user.name);
  const homeCards = useSelector((state) => state.user.settings.homeCards);
  const today = todayISO();

  const series = useMemo(() => seriesFromHistory(history, dailyLog, 7), [history, dailyLog]);
  const streak = useMemo(() => streakFromHistory(history), [history]);
  const window = useMemo(() => fastingWindow(dailyLog.meals), [dailyLog.meals]);

  const consumed = Math.round(dailyLog.totals?.calories || 0);
  const target = Math.round(targets.calories || 0);
  const remaining = Math.max(0, target - consumed);

  const score = useMemo(
    () =>
      healthScore({
        totals: dailyLog.totals,
        micros: dailyLog.micros,
        targets,
        water: dailyLog.water,
        waterTarget: targets.water,
        mealCount: dailyLog.meals.length,
      }),
    [dailyLog, targets]
  );

  const order = Array.isArray(homeCards) && homeCards.length ? homeCards : DEFAULT_CARDS;
  const weakest = [...score.parts]
    .filter((part) => part.points < part.max)
    .sort((a, b) => a.points / a.max - b.points / b.max)
    .slice(0, 2);

  const cards = {
    score: (
      <Pressable
        key="score"
        onPress={() => navigation.navigate('Nutrients')}
        accessibilityRole="button"
        accessibilityLabel={`Health score ${score.score} of 100. Open micronutrients.`}
        style={({ pressed }) => [styles.scoreCard, pressed && styles.pressed]}
      >
        <View style={styles.scoreHeader}>
          <View>
            <Text style={[typography.caption, styles.scoreLabel]}>Today</Text>
            <Text style={[typography.display, styles.scoreValue]}>{score.score}</Text>
            <Text style={[typography.label, styles.scoreBand]}>
              {SCORE_BAND_LABELS[score.band]}
            </Text>
          </View>
          {streak > 0 ? (
            <View style={styles.streak}>
              <MaterialCommunityIcons name="fire" size={iconSize.sm} color={colors.accent} />
              <Text style={[typography.caption, styles.streakText]}>
                {streak} day{streak === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>
        {weakest.length ? (
          <View style={styles.gaps}>
            {weakest.map((part) => (
              <Text key={part.key} style={[typography.caption, styles.gapText]}>
                {part.label}: {part.detail}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, styles.gapText]}>Every part of the day is met.</Text>
        )}
      </Pressable>
    ),

    calories: (
      <Card key="calories">
        <View style={styles.heroHeader}>
          <View>
            <Text style={[typography.caption, styles.scoreLabel]}>Calories remaining</Text>
            <Text style={[typography.title, styles.heroValue]}>
              {remaining.toLocaleString('en-US')}
            </Text>
          </View>
          <Text style={[typography.caption, styles.heroFoot]}>
            {consumed.toLocaleString('en-US')} eaten
            {name ? ` · ${name.split(' ')[0]}` : ''}
          </Text>
        </View>
        <Meter value={consumed} target={target} label={`${percent(consumed, target)}% of target`} />
      </Card>
    ),

    fasting: window ? (
      <Card key="fasting">
        <SectionHeader title="Eating window" action={{ label: 'Not advice', onPress: () => navigation.navigate('Support') }} />
        <Text style={[typography.title, styles.heroValue]}>
          {formatDuration(window.eatingMinutes)}
        </Text>
        <Text style={[typography.caption, styles.heroFoot]}>
          from first to last meal · {formatDuration(window.fastingMinutes)} since the last one
        </Text>
        <Text style={[typography.caption, styles.caution]}>
          Derived from your log, not a fasting plan. Fasting is not appropriate during
          pregnancy or with a history of disordered eating.
        </Text>
      </Card>
    ) : null,

    macros: <DailyProgressCard key="macros" progress={dailyLog.totals} targets={targets} />,

    water: (
      <WaterTrackerCard
        key="water"
        waterMl={dailyLog.water}
        targetMl={targets.water}
      />
    ),

    history: (
      <Card key="history">
        <SectionHeader
          title="Last 7 days"
          action={{ label: 'Stats', onPress: () => navigation.navigate('Stats') }}
        />
        {history.length === 0 ? (
          <Text style={[typography.caption, styles.heroFoot]}>
            Completed days appear here once you have logged two days in a row.
          </Text>
        ) : (
          <HistoryStrip series={series} metric="calories" target={targets.calories} />
        )}
      </Card>
    ),

    meals: (
      <View key="meals">
        <SectionHeader
          title="Meals"
          action={{ label: 'Open diary', onPress: () => navigation.navigate('Diary') }}
        />
        <RecentMealsCard meals={dailyLog.meals} />
      </View>
    ),
  };

  const visible = order.map((id) => cards[id]).filter(Boolean);

  return (
    <ScreenScaffold title={greeting()} subtitle={formatLongDate(today)}>
      {visible.length ? visible : cards.calories}

      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() =>
              action.key === 'add'
                ? navigation.navigate('MealEntry', { mealType: 'lunch', date: today })
                : navigation.navigate(action.route)
            }
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name={action.icon} size={iconSize.lg} color={colors.accent} />
            <Text style={[typography.caption, styles.actionLabel]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  scoreCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.sm,
  },
  pressed: { opacity: 0.75 },
  scoreHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  scoreLabel: { color: colors.inkSecondary },
  scoreValue: { color: colors.ink },
  scoreBand: { color: colors.accent },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  streakText: { color: colors.accent },
  gaps: { gap: 2 },
  gapText: { color: colors.inkSecondary },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  heroValue: { color: colors.ink },
  heroFoot: { color: colors.inkTertiary, marginTop: space.xs },
  caution: { color: colors.inkTertiary, marginTop: space.sm },
  actions: { flexDirection: 'row', gap: space.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  actionLabel: { color: colors.inkSecondary },
});

export default TodayScreen;
