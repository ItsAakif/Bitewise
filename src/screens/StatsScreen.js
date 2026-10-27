import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Segmented from '../components/Segmented';
import StatRow from '../components/StatRow';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import NumberField from '../components/NumberField';
import { seriesFromHistory, streakFromHistory, averageOf, totalOf } from '../utils/nutrition';
import { formatDayLabel } from '../utils/date';
import { logWeight } from '../redux/slices/healthSlice';
import Badge from '../components/Badge';
import { estimateExpenditure, CONFIDENCE_COPY } from '../utils/expenditure';

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

const METRICS = [
  { label: 'Calories', value: 'calories' },
  { label: 'Protein', value: 'protein' },
  { label: 'Water', value: 'water' },
];

const UNIT = { calories: 'kcal', protein: 'g', water: 'ml' };

const StatsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const { history } = useSelector((state) => state.nutrition);
  const dailyLog = useSelector((state) => state.nutrition.dailyLog);
  const targets = useSelector((state) => state.user.targets);
  const weight = useSelector((state) => state.health.weight);
  const [range, setRange] = useState(7);
  const [metric, setMetric] = useState('calories');
  const [weightDraft, setWeightDraft] = useState(weight.current ?? 0);

  const series = useMemo(
    () => seriesFromHistory(history, dailyLog, range),
    [history, dailyLog, range]
  );
  const loggedDays = series.filter((day) => day.calories > 0 || day.water > 0).length;
  const streak = useMemo(() => streakFromHistory(history), [history]);

  const values = series.map((day) => Math.round(day[metric] || 0));
  const labels = series.map((day, index) => {
    if (range === 30 && index % 5 !== 0 && index !== series.length - 1) return '';
    return formatDayLabel(day.date).split(' ')[0];
  });

  const expenditure = useMemo(
    () => estimateExpenditure({ history, dailyLog, weights: weight.history || [] }),
    [history, dailyLog, weight.history]
  );

  const chartWidth = Math.max(240, width - space.base * 2 - space.base * 2);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 107, 78, ${opacity})`,
    labelColor: () => colors.inkTertiary,
    propsForDots: { r: '2.5', strokeWidth: '0' },
    propsForBackgroundLines: { stroke: colors.line, strokeDasharray: '' },
  };

  return (
    <ScreenScaffold title="Progress" subtitle={`${loggedDays} logged day${loggedDays === 1 ? '' : 's'} in this range`} onBack={() => navigation.goBack()}>
      <Segmented options={RANGES} value={range} onChange={setRange} />
      <Segmented options={METRICS} value={metric} onChange={setMetric} />

      <Card>
        {loggedDays === 0 ? (
          <EmptyState
            icon="chart-timeline-variant"
            title="No history yet"
            body="A day is written into history once it has food or water logged and the date changes. Log today and come back tomorrow."
          />
        ) : (
          <LineChart
            data={{ labels, datasets: [{ data: values.length ? values : [0] }] }}
            width={chartWidth}
            height={180}
            chartConfig={chartConfig}
            bezier
            withShadow={false}
            withInnerLines
            withOuterLines={false}
            style={styles.chart}
            fromZero
          />
        )}
      </Card>

      <Card>
        <Text style={[typography.label, styles.sectionLabel]}>Summary</Text>
        <StatRow label={`Average ${metric}`} value={`${averageOf(series, metric)} ${UNIT[metric]}`} target={metric === 'calories' ? `${targets.calories} kcal` : undefined} />
        <StatRow label="Logged days" value={`${loggedDays} of ${range}`} />
        <StatRow label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
        <StatRow label="Calories logged" value={`${totalOf(series, 'calories')} kcal`} />
        <StatRow label="Water logged" value={`${totalOf(series, 'water')} ml`} />
      </Card>

      <Card>
        <Text style={[typography.label, styles.sectionLabel]}>Energy expenditure</Text>
        {expenditure.tdee ? (
          <>
            <Text style={[typography.title, styles.expenditureValue]}>
              {expenditure.tdee.toLocaleString('en-US')} kcal
            </Text>
            <View style={styles.confidenceRow}>
              <Badge
                label={CONFIDENCE_COPY[expenditure.confidence]}
                tone={expenditure.confidence === 'high' ? 'accent' : 'muted'}
              />
              <Text style={[typography.caption, styles.note]}>
                {expenditure.days} days of logs
              </Text>
            </View>
            <Text style={[typography.caption, styles.note]}>{expenditure.message}</Text>
          </>
        ) : (
          <Text style={[typography.caption, styles.note]}>{expenditure.message}</Text>
        )}
        <Text style={[typography.caption, styles.footnote]}>
          Worked out from what you ate and how your weight moved — not from a formula table.
          It is an estimate and it needs both food and weight logged on the same days.
        </Text>
      </Card>

      <Card>
        <Text style={[typography.label, styles.sectionLabel]}>Body weight</Text>
        {weight.current != null ? (
          <StatRow label="Latest" value={`${weight.current} kg`} target={weight.goal ? `${weight.goal} kg` : undefined} />
        ) : (
          <Text style={[typography.caption, styles.note]}>
            No weight recorded yet. Add it below; it is stored on this device.
          </Text>
        )}
        <NumberField
          label="Today's weight"
          value={weightDraft}
          onChange={setWeightDraft}
          min={20}
          max={400}
          step={0.5}
          unit="kg"
        />
        <Button
          label="Save weight"
          variant="secondary"
          onPress={() => dispatch(logWeight({ value: weightDraft }))}
        />
      </Card>

      <View style={styles.footerRow}>
        <Button
          label="Insights"
          icon="lightbulb-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Insights')}
        />
        <Button
          label="Goals"
          icon="target"
          variant="secondary"
          onPress={() => navigation.navigate('Goals')}
        />
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  chart: { borderRadius: radius.md, marginLeft: -space.sm },
  sectionLabel: { color: colors.inkSecondary, marginBottom: space.xs },
  footerRow: { flexDirection: 'row', gap: space.sm },
  expenditureValue: { color: colors.ink },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: space.xs },
  footnote: { color: colors.inkTertiary, marginTop: space.sm },
  note: { color: colors.inkSecondary, marginBottom: space.sm },
});

export default StatsScreen;
