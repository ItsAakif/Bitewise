import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import NumberField from '../components/NumberField';
import { WORKOUTS } from '../data/workouts';
import { logWorkout } from '../redux/slices/fitnessSlice';

const INTENSITY = { low: 'Easy effort', moderate: 'Moderate effort', high: 'Hard effort' };

/** "3 × 8", "45 s", "10 each leg" — take the first integer, else 8. */
const defaultReps = (text) => {
  const match = /\d+/.exec(String(text || ''));
  return match ? Number(match[0]) : 8;
};

const WorkoutDetailScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { workoutId } = route.params || {};
  const workout = useMemo(() => WORKOUTS.find((w) => w.id === workoutId), [workoutId]);

  // One editable set row per exercise, expanded on demand. Logging happens as you
  // train, so the screen must stay short.
  const [session, setSession] = useState(() =>
    (workout?.exercises || []).map((exercise) => [
      { reps: defaultReps(exercise.reps), weightKg: 0, done: false },
    ])
  );
  const [logged, setLogged] = useState(false);

  const history = useSelector((state) => state.fitness.workouts);

  const previousFor = (name) => {
    const key = String(name).toLowerCase();
    for (const log of history) {
      const match = (log.exercises || []).find((e) => String(e.name).toLowerCase() === key);
      if (match) return { date: log.date, sets: match.sets };
    }
    return null;
  };

  if (!workout) {
    return (
      <ScreenScaffold title="Workout" onBack={() => navigation.goBack()}>
        <Card>
          <EmptyState
            icon="help-circle-outline"
            title="Workout not found"
            body="It may have been removed from the catalogue."
            action={{ label: 'Back to workouts', onPress: () => navigation.goBack() }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  const patchSet = (exerciseIndex, setIndex, patch) => {
    setSession((current) =>
      current.map((sets, i) =>
        i === exerciseIndex
          ? sets.map((set, j) => (j === setIndex ? { ...set, ...patch } : set))
          : sets
      )
    );
  };

  const addSet = (exerciseIndex) => {
    setSession((current) =>
      current.map((sets, i) => {
        if (i !== exerciseIndex) return sets;
        const last = sets[sets.length - 1];
        return [...sets, { reps: last?.reps ?? 8, weightKg: last?.weightKg ?? 0, done: false }];
      })
    );
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setSession((current) =>
      current.map((sets, i) =>
        i === exerciseIndex ? sets.filter((_, j) => j !== setIndex) : sets
      )
    );
  };

  const completedSets = session.flat().filter((set) => set.done).length;

  return (
    <ScreenScaffold
      title={workout.name}
      subtitle={`${workout.minutes} min · ${workout.calories} kcal`}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={
            logged
              ? 'Logged to your history'
              : completedSets
                ? `Log ${completedSets} set${completedSets === 1 ? '' : 's'}`
                : 'Log this workout'
          }
          icon={logged ? 'check' : 'plus'}
          disabled={logged}
          onPress={() => {
            dispatch(
              logWorkout({
                workoutId: workout.id,
                name: workout.name,
                minutes: workout.minutes,
                calories: workout.calories,
                exercises: workout.exercises.map((exercise, index) => ({
                  name: exercise.name,
                  sets: session[index],
                })),
              })
            );
            setLogged(true);
          }}
          fullWidth
        />
      }
    >
      <Card>
        <Text style={[typography.body, styles.description]}>{workout.description}</Text>
        <View style={styles.badges}>
          <Badge label={workout.type} />
          <Badge label={INTENSITY[workout.intensity]} tone="muted" />
          {workout.equipment.length ? (
            <Badge label={workout.equipment.join(', ')} tone="muted" />
          ) : (
            <Badge label="No equipment" tone="muted" />
          )}
        </View>
      </Card>

      {workout.exercises.map((exercise, exerciseIndex) => {
        const previous = previousFor(exercise.name);
        return (
          <Card key={`${exercise.name}-${exerciseIndex}`}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseText}>
                <Text style={[typography.heading, styles.exerciseName]}>{exercise.name}</Text>
                <Text style={[typography.caption, styles.exerciseMeta]}>
                  Planned {exercise.sets} × {exercise.reps}
                </Text>
              </View>
              <Text style={[typography.caption, styles.exerciseIndex]}>
                {String(exerciseIndex + 1).padStart(2, '0')}
              </Text>
            </View>

            {previous ? (
              <Text style={[typography.caption, styles.previous]}>
                Last time ({previous.date}):{' '}
                {previous.sets
                  .filter((set) => set.done)
                  .map((set) => `${set.reps}×${set.weightKg}kg`)
                  .join(', ') || 'nothing marked done'}
              </Text>
            ) : (
              <Text style={[typography.caption, styles.previous]}>No previous record</Text>
            )}

            {session[exerciseIndex].map((set, setIndex) => (
              <View key={`set-${exerciseIndex}-${setIndex}`} style={styles.setRow}>
                <View style={styles.setFields}>
                  <View style={styles.setField}>
                    <NumberField
                      label={setIndex === 0 ? 'Reps' : undefined}
                      value={set.reps}
                      min={0}
                      max={200}
                      step={1}
                      onChange={(value) => patchSet(exerciseIndex, setIndex, { reps: value })}
                    />
                  </View>
                  <View style={styles.setField}>
                    <NumberField
                      label={setIndex === 0 ? 'Weight' : undefined}
                      unit="kg"
                      value={set.weightKg}
                      min={0}
                      max={500}
                      step={2.5}
                      onChange={(value) => patchSet(exerciseIndex, setIndex, { weightKg: value })}
                    />
                  </View>
                </View>
                <Pressable
                  onPress={() => patchSet(exerciseIndex, setIndex, { done: !set.done })}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Mark set ${setIndex + 1} done`}
                  accessibilityState={{ checked: set.done }}
                  style={[styles.doneToggle, set.done && styles.doneActive]}
                >
                  <Text style={[typography.caption, set.done ? styles.doneText : styles.doneIdle]}>
                    {set.done ? 'Done' : 'Mark'}
                  </Text>
                </Pressable>
                {session[exerciseIndex].length > 1 ? (
                  <Pressable
                    onPress={() => removeSet(exerciseIndex, setIndex)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove set ${setIndex + 1}`}
                    hitSlop={8}
                  >
                    <Text style={[typography.caption, styles.remove]}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            <Button
              label="Add a set"
              variant="ghost"
              icon="plus"
              onPress={() => addSet(exerciseIndex)}
            />
          </Card>
        );
      })}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  description: { color: colors.ink, marginBottom: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  exerciseText: { flex: 1, gap: 2 },
  exerciseName: { color: colors.ink },
  exerciseMeta: { color: colors.inkSecondary },
  exerciseIndex: { color: colors.inkTertiary, fontVariant: ['tabular-nums'] },
  previous: { color: colors.inkTertiary, marginTop: space.xs, marginBottom: space.sm },
  setRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  setFields: { flex: 1, flexDirection: 'row', gap: space.sm },
  setField: { flex: 1 },
  doneToggle: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 44,
    justifyContent: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  doneActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  doneText: { color: colors.accent },
  doneIdle: { color: colors.inkSecondary },
  remove: { color: colors.inkTertiary, marginBottom: space.md },
});

export default WorkoutDetailScreen;
