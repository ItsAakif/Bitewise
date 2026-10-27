import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Chip from '../components/Chip';
import { FAQ, FAQ_CATEGORIES } from '../data/faq';

const SupportScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.filter((entry) => {
      if (category && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.question.toLowerCase().includes(q) ||
        entry.answer.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <ScreenScaffold title="Support" subtitle={`${FAQ.length} answers`} onBack={() => navigation.goBack()}>
      <Input value={query} onChangeText={setQuery} placeholder="Search questions" />

      <View style={styles.chipWrap}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {FAQ_CATEGORIES.map((value) => (
          <Chip key={value} label={value} selected={category === value} onPress={() => setCategory(value)} />
        ))}
      </View>

      <Card padded={false}>
        <View style={styles.listPad}>
          {filtered.length === 0 ? (
            <Text style={[typography.body, styles.empty]}>
              Nothing matched that. Try a shorter word, or read the privacy note under About.
            </Text>
          ) : (
            filtered.map((entry, index) => {
              const open = openId === entry.id;
              return (
                <View key={entry.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => setOpenId(open ? null : entry.id)}
                    accessibilityRole="button"
                    accessibilityLabel={entry.question}
                    accessibilityState={{ expanded: open }}
                    style={styles.questionRow}
                  >
                    <View style={styles.questionText}>
                      <Text style={[typography.caption, styles.category]}>{entry.category}</Text>
                      <Text style={[typography.body, styles.question]}>{entry.question}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={iconSize.md}
                      color={colors.inkTertiary}
                    />
                  </Pressable>
                  {open ? (
                    <Text style={[typography.body, styles.answer]}>{entry.answer}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </Card>

      <Card>
        <Text style={[typography.heading, styles.contactTitle]}>Still stuck?</Text>
        <Text style={[typography.body, styles.contactBody]}>
          This build has no support inbox wired up. If you are running it from source, open an
          issue in the project repository with the screen, what you expected and what happened.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('About')}
          accessibilityRole="button"
          accessibilityLabel="Read about this app"
          style={styles.link}
        >
          <Text style={[typography.label, styles.linkText]}>About and privacy</Text>
        </Pressable>
      </Card>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  listPad: { paddingHorizontal: space.base },
  divider: { height: 1, backgroundColor: colors.line },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
  },
  questionText: { flex: 1, gap: 2 },
  category: { color: colors.inkTertiary },
  question: { color: colors.ink },
  answer: {
    color: colors.inkSecondary,
    paddingBottom: space.md,
    lineHeight: 22,
  },
  empty: { color: colors.inkSecondary, padding: space.base },
  contactTitle: { color: colors.ink, marginBottom: space.xs },
  contactBody: { color: colors.inkSecondary },
  link: { marginTop: space.md, borderRadius: radius.sm },
  linkText: { color: colors.accent },
});

export default SupportScreen;
