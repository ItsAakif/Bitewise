import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Markdown from '../components/Markdown';
import { sendMessage, clearError, clearChat } from '../redux/slices/chatSlice';
import { readConfig } from '../services/aiProvider';
import { formatClock } from '../utils/date';

const SUGGESTIONS = [
  'What should I eat after a workout?',
  'Am I hitting my protein target?',
  'Suggest a light dinner under 400 kcal',
  'How do I get more iron from vegetarian food?',
];

const VirtualNutritionistScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { messages, loading, error, available } = useSelector((state) => state.chat);
  const ai = readConfig(useSelector((state) => state.user.settings.ai));
  const canChat = ai.chatReady || available;

  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  const send = async (text) => {
    const message = String(text ?? draft).trim();
    if (!message || loading) return;
    setDraft('');
    await dispatch(sendMessage({ message, context: messages }));
  };

  if (!canChat) {
    return (
      <ScreenScaffold title="Coach" subtitle="Nutritionist chat">
        <Card>
          <EmptyState
            icon="robot-outline"
            title="No model configured"
            body="Add a free OpenRouter key in Settings to talk to a model with your own key, or point the app at your own server. Until then the chat stays off rather than answering with canned text."
            action={{ label: 'Open Settings', onPress: () => navigation.navigate('Settings') }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenScaffold
        title="Coach"
        subtitle={ai.chatReady ? `Your key · ${ai.chatModel}` : 'Your server'}
        scroll={false}
        action={
          messages.length
            ? { icon: 'delete-outline', label: 'Clear chat', onPress: () => dispatch(clearChat()) }
            : undefined
        }
        footer={
          <View style={styles.composer}>
            <View style={styles.inputWrap}>
              <Input
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask about food, habits or targets"
                multiline
              />
            </View>
            <Pressable
              onPress={() => send()}
              disabled={!draft.trim() || loading}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !draft.trim() || loading }}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || loading) && styles.sendDisabled,
                pressed && styles.sendPressed,
              ]}
            >
              <MaterialCommunityIcons name="arrow-up" size={iconSize.md} color={colors.onAccent} />
            </Pressable>
          </View>
        }
      >
        {error ? (
          <View style={styles.errorWrap}>
            <ErrorMessage message={error} onRetry={() => dispatch(clearError())} />
          </View>
        ) : null}

        {messages.length === 0 ? (
          <View style={styles.intro}>
            <Card>
              <View style={styles.introHeader}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="robot-outline" size={iconSize.md} color={colors.accent} />
                </View>
                <View style={styles.introText}>
                  <Text style={[typography.heading, styles.introTitle]}>Ask about your own data</Text>
                  <Text style={[typography.caption, styles.introBody]}>
                    Replies are grounded in your targets, today&apos;s totals and the food catalogue.
                    Nothing is invented — if it needs a number it does not have, it should say so.
                  </Text>
                </View>
              </View>
            </Card>

            <Text style={[typography.label, styles.suggestionsLabel]}>Try one of these</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => send(suggestion)}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                >
                  <Text style={[typography.body, styles.suggestionText]}>{suggestion}</Text>
                  <MaterialCommunityIcons name="arrow-up-right" size={iconSize.sm} color={colors.inkTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.sender === 'user';
              return (
                <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowCoach]}>
                  {!mine ? (
                    <View style={styles.avatarSmall}>
                      <MaterialCommunityIcons name="robot-outline" size={iconSize.sm} color={colors.accent} />
                    </View>
                  ) : null}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleCoach]}>
                    {mine ? (
                      <Text style={[typography.body, styles.userText]}>{item.text}</Text>
                    ) : (
                      <Markdown content={item.text} />
                    )}
                    <Text style={[typography.caption, styles.time]}>{formatClock(item.timestamp)}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={loading ? <LoadingSpinner label="Thinking" /> : null}
          />
        )}
      </ScreenScaffold>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  errorWrap: { paddingHorizontal: space.base },
  intro: { padding: space.base, gap: space.lg },
  introHeader: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1, gap: space.xs },
  introTitle: { color: colors.ink },
  introBody: { color: colors.inkSecondary },
  suggestionsLabel: { color: colors.inkSecondary },
  suggestions: { gap: space.sm },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
  },
  suggestionPressed: { opacity: 0.7 },
  suggestionText: { color: colors.ink, flex: 1 },
  list: { padding: space.base, gap: space.md },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowCoach: { justifyContent: 'flex-start' },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.xs,
  },
  bubbleMine: { backgroundColor: colors.accentSoft, borderBottomRightRadius: radius.sm },
  bubbleCoach: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: radius.sm,
  },
  userText: { color: colors.ink },
  time: { color: colors.inkTertiary, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  inputWrap: { flex: 1 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendPressed: { backgroundColor: colors.accentPressed },
});

export default VirtualNutritionistScreen;
