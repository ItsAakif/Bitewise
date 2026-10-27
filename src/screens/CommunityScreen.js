import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import Post from '../components/social/Post';
import { CHALLENGES } from '../data/challenges';
import {
  addPost,
  deletePost,
  toggleLike,
  addComment,
  startChallenge,
  stopChallenge,
  markChallengeDay,
} from '../redux/slices/socialSlice';
import { todayISO } from '../utils/date';

const CommunityScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.social.posts);
  const progress = useSelector((state) => state.social.challenges);
  const userId = useSelector((state) => state.auth.user?.id || 'local-user');
  const name = useSelector((state) => state.user.name || 'You');
  const mode = useSelector((state) => state.auth.mode);

  const [draft, setDraft] = useState('');
  const today = todayISO();

  const publish = () => {
    const body = draft.trim();
    if (!body) return;
    dispatch(addPost({ body, authorName: name }));
    setDraft('');
  };

  return (
    <ScreenScaffold title="Community" subtitle="Your journal and personal challenges" onBack={() => navigation.goBack()}>
      <Card>
        <Text style={[typography.label, styles.label]}>Write a post</Text>
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder="How did today go?"
          multiline
          autoCapitalize="sentences"
        />
        <Button label="Post" onPress={publish} disabled={!draft.trim()} />
        <Text style={[typography.caption, styles.note]}>
          {mode === 'local'
            ? 'Local mode: posts are stored on this device and visible only to you.'
            : 'Posts are written to the configured Firebase project.'}
        </Text>
      </Card>

      <View>
        <SectionHeader title="Challenges" />
        {CHALLENGES.map((challenge) => {
          const entry = progress.find((c) => c.id === challenge.id);
          const completedDays = entry?.days?.length || 0;
          const doneToday = entry?.days?.includes(today);

          return (
            <View key={challenge.id} style={styles.challenge}>
              <View style={styles.challengeHeader}>
                <Text style={[typography.heading, styles.challengeTitle]}>{challenge.title}</Text>
                <Badge
                  label={entry ? `${completedDays}/${challenge.days}` : `${challenge.days} days`}
                  tone={entry ? 'accent' : 'muted'}
                />
              </View>
              <Text style={[typography.caption, styles.challengeBody]}>{challenge.description}</Text>
              <Text style={[typography.caption, styles.challengeGoal]}>
                {challenge.dailyGoal} {challenge.unit} a day
              </Text>
              <View style={styles.challengeActions}>
                {!entry ? (
                  <Button
                    label="Start"
                    variant="secondary"
                    onPress={() => dispatch(startChallenge(challenge.id))}
                  />
                ) : (
                  <>
                    <Button
                      label={doneToday ? 'Done today' : 'Mark today done'}
                      variant={doneToday ? 'ghost' : 'secondary'}
                      disabled={doneToday}
                      onPress={() => dispatch(markChallengeDay({ id: challenge.id }))}
                    />
                    <Button
                      label="Leave"
                      variant="ghost"
                      onPress={() => dispatch(stopChallenge(challenge.id))}
                    />
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View>
        <SectionHeader title={`Posts · ${posts.length}`} />
        {posts.length === 0 ? (
          <Card>
            <EmptyState
              icon="post-outline"
              title="No posts yet"
              body="Write one above. It stays on this device unless Firebase is configured."
            />
          </Card>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUserId={userId}
              onLike={(postId) => dispatch(toggleLike({ postId, userId }))}
              onComment={(postId, body) => dispatch(addComment({ postId, body, authorName: name }))}
              onDelete={(postId) => dispatch(deletePost(postId))}
            />
          ))
        )}
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.inkSecondary, marginBottom: space.xs },
  note: { color: colors.inkTertiary, marginTop: space.sm },
  challenge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.xs,
    marginBottom: space.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  challengeTitle: { color: colors.ink, flex: 1 },
  challengeBody: { color: colors.inkSecondary },
  challengeGoal: { color: colors.inkTertiary, fontVariant: ['tabular-nums'] },
  challengeActions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});

export default CommunityScreen;
