import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import GoalCard from '../components/GoalCard';
import { addGoal, updateGoal, removeGoal, toggleComplete } from '../redux/slices/goalsSlice';

const KINDS = [
  { value: 'calories', label: 'Calories', unit: 'kcal' },
  { value: 'protein', label: 'Protein', unit: 'g' },
  { value: 'water', label: 'Water', unit: 'ml' },
  { value: 'steps', label: 'Steps', unit: 'steps' },
  { value: 'weight', label: 'Weight', unit: 'kg' },
  { value: 'workouts', label: 'Workouts / week', unit: 'sessions' },
  { value: 'custom', label: 'Something else', unit: '' },
];

const GoalsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const goals = useSelector((state) => state.goals.items);
  const steps = useSelector((state) => state.health.steps);
  const dailyLog = useSelector((state) => state.nutrition.dailyLog);
  const weight = useSelector((state) => state.health.weight);
  const workouts = useSelector((state) => state.fitness.workouts);

  const [kind, setKind] = useState('water');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const workoutsThisWeek = workouts.filter((log) => {
    const delta = (Date.now() - new Date(log.date).getTime()) / 86400000;
    return delta >= 0 && delta < 7;
  }).length;

  // Progress is the measured value, never the target itself.
  const progressFor = (goal) => {
    switch (goal.kind) {
      case 'calories':
        return Math.round(dailyLog.totals?.calories || 0);
      case 'protein':
        return Math.round(dailyLog.totals?.protein || 0);
      case 'water':
        return Math.round(dailyLog.water || 0);
      case 'steps':
        return steps.today;
      case 'workouts':
        return workoutsThisWeek;
      case 'weight':
        return goal.start != null && weight.current != null
          ? Math.abs(goal.start - weight.current)
          : 0;
      default:
        return 0;
    }
  };

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setTarget('');
    setNotice(null);
  };

  const save = () => {
    const numeric = Number(target);
    if (!title.trim()) {
      setNotice('Give the goal a name.');
      return;
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setNotice('Enter a target above zero.');
      return;
    }
    const unit = KINDS.find((k) => k.value === kind)?.unit || '';

    if (editing) {
      dispatch(updateGoal({ id: editing.id, patch: { title: title.trim(), target: numeric, kind, unit } }));
    } else {
      dispatch(
        addGoal({
          kind,
          title: title.trim(),
          target: numeric,
          unit,
          start: kind === 'weight' ? weight.current : null,
        })
      );
    }
    resetForm();
  };

  const active = goals.filter((goal) => !goal.completedAt);
  const done = useMemo(() => goals.filter((goal) => goal.completedAt), [goals]);

  return (
    <ScreenScaffold title="Goals" subtitle={`${active.length} active`} onBack={() => navigation.goBack()}>
      <Card>
        <Text style={[typography.label, styles.label]}>
          {editing ? 'Edit goal' : 'New goal'}
        </Text>
        <View style={styles.chipWrap}>
          {KINDS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={kind === option.value}
              onPress={() => setKind(option.value)}
            />
          ))}
        </View>
        <Input
          label="What are you aiming for?"
          value={title}
          onChangeText={setTitle}
          placeholder="Drink two litres a day"
          autoCapitalize="sentences"
        />
        <Input
          label={`Target${KINDS.find((k) => k.value === kind)?.unit ? ` (${KINDS.find((k) => k.value === kind).unit})` : ''}`}
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
          placeholder="2000"
        />
        {notice ? <Text style={[typography.caption, styles.notice]}>{notice}</Text> : null}
        <View style={styles.buttonRow}>
          <Button label={editing ? 'Save changes' : 'Add goal'} onPress={save} />
          {editing ? <Button label="Cancel" variant="ghost" onPress={resetForm} /> : null}
        </View>
      </Card>

      {active.length === 0 ? (
        <Card>
          <EmptyState
            icon="target"
            title="No active goals"
            body="A goal is a number you are tracking against a target you set. Add one above."
          />
        </Card>
      ) : (
        active.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={progressFor(goal)}
            onToggle={(id) => dispatch(toggleComplete(id))}
            onDelete={(id) => dispatch(removeGoal(id))}
            onEdit={(g) => {
              setEditing(g);
              setKind(g.kind);
              setTitle(g.title);
              setTarget(String(g.target));
              setNotice(null);
            }}
          />
        ))
      )}

      {done.length > 0 ? (
        <Card>
          <Text style={[typography.label, styles.label]}>Completed</Text>
          {done.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={goal.target}
              onToggle={(id) => dispatch(toggleComplete(id))}
              onDelete={(id) => dispatch(removeGoal(id))}
            />
          ))}
        </Card>
      ) : null}

      <Text style={[typography.caption, styles.footnote]}>
        Calories, protein and water goals show today&apos;s target. Step goals show today&apos;s
        count. Workout goals count sessions in the last seven days. Weight goals track the
        distance from where you started.
      </Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.inkSecondary, marginBottom: space.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  notice: { color: colors.danger },
  buttonRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  footnote: { color: colors.inkTertiary },
});

export default GoalsScreen;
