import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import WorkoutCard from '../components/fitness/WorkoutCard';
import StepCounter from '../components/fitness/StepCounter';
import StatRow from '../components/StatRow';
import { WORKOUTS, WORKOUT_TYPES } from '../data/workouts';
import { logSteps } from '../redux/slices/healthSlice';
import { removeWorkout, volumeOf } from '../redux/slices/fitnessSlice';
import { formatDayLabel } from '../utils/date';

const loadPedometer = () => {
  try {
    // Guarded: a build without the native sensor module must not crash here.
    // eslint-disable-next-line global-require
    return require('expo-sensors').Pedometer;
  } catch {
    return null;
  }
};

const WorkoutsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const steps = useSelector((state) => state.health.steps);
  const logs = useSelector((state) => state.fitness.workouts);
  const [type, setType] = useState(null);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);

  useEffect(() => {
    let subscription;
    let cancelled = false;
    const Pedometer = loadPedometer();
    if (!Pedometer) return undefined;

    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available || cancelled) return;
        setPedometerAvailable(true);
        subscription = Pedometer.watchStepCount((result) => {
          dispatch(logSteps({ value: result.steps }));
        });
      } catch {
        setPedometerAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      if (subscription && subscription.remove) subscription.remove();
    };
  }, [dispatch]);

  const filtered = useMemo(
    () => (type ? WORKOUTS.filter((workout) => workout.type === type) : WORKOUTS),
    [type]
  );

  const thisWeek = logs.filter((log) => {
    const delta = (Date.now() - new Date(log.date).getTime()) / 86400000;
    return delta >= 0 && delta < 7;
  });

  return (
    <ScreenScaffold
      title="Workouts"
      subtitle={`${thisWeek.length} logged this week`}
      onBack={() => navigation.goBack()}
    >
      <Card>
        <StepCounter
          steps={steps.today}
          goal={steps.goal}
          available={pedometerAvailable}
          onManualEntry={(value) => dispatch(logSteps({ value }))}
        />
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" selected={type === null} onPress={() => setType(null)} />
        {WORKOUT_TYPES.map((value) => (
          <Chip key={value} label={value} selected={type === value} onPress={() => setType(value)} />
        ))}
      </ScrollView>

      {filtered.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
        />
      ))}

      <View>
        <SectionHeader title="Recently logged" />
        <Card>
          {logs.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              title="No sessions yet"
              body="Open a workout and log it to build your history."
            />
          ) : (
            logs.slice(0, 8).map((log, index) => (
              <View key={log.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.logRow}>
                  <View style={styles.logText}>
                    <Text style={[typography.body, styles.logName]} numberOfLines={1}>
                      {log.name}
                    </Text>
                    <Text style={[typography.caption, styles.logMeta]}>
                      {formatDayLabel(log.date)} · {log.minutes} min · {log.calories} kcal
                      {volumeOf(log) > 0 ? ` · ${Math.round(volumeOf(log))} kg volume` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => dispatch(removeWorkout(log.id))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${log.name}`}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="close" size={iconSize.sm} color={colors.inkTertiary} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </Card>
      </View>

      <Card>
        <SectionHeader title="This week" />
        <StatRow label="Sessions" value={thisWeek.length} />
        <StatRow
          label="Minutes"
          value={thisWeek.reduce((sum, log) => sum + log.minutes, 0)}
        />
        <StatRow
          label="Calories burned"
          value={thisWeek.reduce((sum, log) => sum + log.calories, 0)}
        />
      </Card>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  divider: { height: 1, backgroundColor: colors.line },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  logText: { flex: 1, gap: 2 },
  logName: { color: colors.ink },
  logMeta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
});

export default WorkoutsScreen;
