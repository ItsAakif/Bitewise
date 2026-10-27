// A post in the community feed. The author is the local user, so the avatar is
// initials from the name — no stock photo, no invented persona.
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../../theme';
import { formatClock } from '../../utils/date';

const initials = (name) =>
  String(name || 'You')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const relativeDay = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return formatClock(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const Post = ({ post, currentUserId, onLike, onComment, onDelete }) => {
  const [draft, setDraft] = useState('');
  const [commenting, setCommenting] = useState(false);
  const liked = (post.likedBy || []).includes(currentUserId);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onComment?.(post.id, body);
    setDraft('');
    setCommenting(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[typography.caption, styles.avatarText]}>
            {initials(post.authorName)}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[typography.label, styles.author]}>{post.authorName}</Text>
          <Text style={[typography.caption, styles.time]}>{relativeDay(post.createdAt)}</Text>
        </View>
        {onDelete ? (
          <Pressable
            onPress={() => onDelete(post.id)}
            accessibilityRole="button"
            accessibilityLabel="Delete post"
            hitSlop={10}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={iconSize.sm}
              color={colors.inkTertiary}
            />
          </Pressable>
        ) : null}
      </View>

      <Text style={[typography.body, styles.body]}>{post.body}</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onLike?.(post.id)}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Remove like' : 'Like'}
          accessibilityState={{ selected: liked }}
          style={styles.action}
        >
          <MaterialCommunityIcons
            name={liked ? 'heart' : 'heart-outline'}
            size={iconSize.sm}
            color={liked ? colors.accent : colors.inkSecondary}
          />
          <Text style={[typography.caption, styles.actionText]}>
            {(post.likedBy || []).length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setCommenting((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Comment"
          style={styles.action}
        >
          <MaterialCommunityIcons
            name="comment-outline"
            size={iconSize.sm}
            color={colors.inkSecondary}
          />
          <Text style={[typography.caption, styles.actionText]}>
            {(post.comments || []).length}
          </Text>
        </Pressable>
      </View>

      {(post.comments || []).length ? (
        <View style={styles.comments}>
          {post.comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text style={[typography.caption, styles.commentAuthor]}>
                {comment.authorName}
              </Text>
              <Text style={[typography.caption, styles.commentBody]}>{comment.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {commenting ? (
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment"
            placeholderTextColor={colors.inkTertiary}
            accessibilityLabel="Comment text"
            style={[typography.body, styles.input]}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel="Send comment"
            style={styles.send}
          >
            <Text style={[typography.caption, styles.sendText]}>Send</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '600' },
  headerText: { flex: 1 },
  author: { color: colors.ink },
  time: { color: colors.inkTertiary },
  body: { color: colors.ink },
  actions: {
    flexDirection: 'row',
    gap: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  actionText: { color: colors.inkSecondary },
  comments: { gap: space.xs },
  comment: { flexDirection: 'row', gap: space.sm },
  commentAuthor: { color: colors.ink, fontWeight: '600' },
  commentBody: { color: colors.inkSecondary, flex: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, color: colors.ink, paddingVertical: space.sm },
  send: { paddingVertical: space.sm },
  sendText: { color: colors.accent },
});

export default Post;
