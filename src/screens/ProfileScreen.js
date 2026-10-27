import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ListRow from '../components/ListRow';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import StatRow from '../components/StatRow';
import { signOutUser } from '../redux/slices/authSlice';
import { streakFromHistory } from '../utils/nutrition';

const initials = (name, email) => {
  const source = String(name || email || 'You').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Y';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const LINKS = [
  { icon: 'target', title: 'Goals', subtitle: 'What you are tracking', route: 'Goals' },
  { icon: 'chart-timeline-variant', title: 'Progress', subtitle: 'Charts and history', route: 'Stats' },
  { icon: 'dumbbell', title: 'Workouts', subtitle: 'Sessions and step count', route: 'Workouts' },
  { icon: 'silverware-fork-knife', title: 'Recipes', subtitle: 'Browse and customise', route: 'Recipes' },
  { icon: 'calendar-week', title: 'Meal plan', subtitle: 'This week from the catalogue', route: 'MealPlanning' },
  { icon: 'account-group-outline', title: 'Community', subtitle: 'Your journal and challenges', route: 'Community' },
  { icon: 'bell-outline', title: 'Reminders', subtitle: 'Notification times', route: 'Notifications' },
  { icon: 'cog-outline', title: 'Settings', subtitle: 'Profile, targets, account', route: 'Settings' },
  { icon: 'lifebuoy', title: 'Support', subtitle: 'Questions and answers', route: 'Support' },
  { icon: 'information-outline', title: 'About', subtitle: 'What this app does', route: 'About' },
];

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);
  const { history, dailyLog } = useSelector((state) => state.nutrition);
  const workouts = useSelector((state) => state.fitness.workouts);
  const goals = useSelector((state) => state.goals.items);

  const streak = useMemo(() => streakFromHistory(history), [history]);
  const loggedDays = history.length + ((dailyLog.totals?.calories || 0) > 0 ? 1 : 0);
  const workoutsThisWeek = workouts.filter((log) => {
    const delta = (Date.now() - new Date(log.date).getTime()) / 86400000;
    return delta >= 0 && delta < 7;
  }).length;

  const displayName = user.name || auth.user?.displayName || 'You';
  const email = user.email || auth.user?.email || '';

  return (
    <ScreenScaffold title="Profile" subtitle={auth.mode === 'local' ? 'Local device account' : 'Firebase account'}>
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={[typography.title, styles.avatarText]}>{initials(displayName, email)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[typography.heading, styles.name]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[typography.caption, styles.email]} numberOfLines={1}>
              {email || 'No email on file'}
            </Text>
          </View>
          <Badge label={auth.mode === 'local' ? 'Local' : 'Firebase'} tone="muted" />
        </View>
      </Card>

      <Card>
        <SectionHeader title="At a glance" />
        <StatRow label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
        <StatRow label="Days logged" value={loggedDays} />
        <StatRow label="Workouts this week" value={workoutsThisWeek} />
        <StatRow label="Active goals" value={goals.filter((goal) => !goal.completedAt).length} />
      </Card>

      <Card padded={false}>
        <View style={styles.listPad}>
          {LINKS.map((link, index) => (
            <View key={link.route}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <ListRow
                icon={link.icon}
                title={link.title}
                subtitle={link.subtitle}
                onPress={() => navigation.navigate(link.route)}
              />
            </View>
          ))}
        </View>
      </Card>

      <Button label="Sign out" variant="secondary" onPress={() => dispatch(signOutUser())} fullWidth />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 18, lineHeight: 22 },
  identityText: { flex: 1, gap: 2 },
  name: { color: colors.ink },
  email: { color: colors.inkSecondary },
  listPad: { paddingHorizontal: space.base, paddingVertical: space.xs },
  divider: { height: 1, backgroundColor: colors.line },
});

export default ProfileScreen;
