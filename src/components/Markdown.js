// Minimal markdown for coach replies.
//
// Models emit markdown whether or not you ask, and rendering it as literal
// asterisks makes good advice look broken. This covers what a reply actually
// uses — bold, italics, inline code, headings, bullets, numbered lists — and
// deliberately ignores the rest rather than pulling in a parser dependency.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space, radius } from '../theme';

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;

function renderInline(text, keyPrefix, baseStyle) {
  const parts = String(text).split(INLINE).filter((part) => part !== '');
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (/^\*\*[\s\S]+\*\*$/.test(part) || /^__[\s\S]+__$/.test(part)) {
      return (
        <Text key={key} style={[baseStyle, styles.bold]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (/^\*[\s\S]+\*$/.test(part) || /^_[\s\S]+_$/.test(part)) {
      return (
        <Text key={key} style={[baseStyle, styles.italic]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (/^`[\s\S]+`$/.test(part)) {
      return (
        <Text key={key} style={[baseStyle, styles.code]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return (
      <Text key={key} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

function blocks(content) {
  const lines = String(content || '').split(/\r?\n/);
  const out = [];
  let list = null;

  const flush = () => {
    if (list) {
      out.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flush();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      out.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list || list.type !== 'bullets') {
        flush();
        list = { type: 'bullets', items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      if (!list || list.type !== 'numbers') {
        flush();
        list = { type: 'numbers', items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }

    flush();
    out.push({ type: 'paragraph', text: line });
  }

  flush();
  return out;
}

export function Markdown({ content, tone = 'coach' }) {
  const base = tone === 'user' ? styles.userText : styles.coachText;
  const rows = blocks(content);

  return (
    <View style={styles.container}>
      {rows.map((row, index) => {
        const key = `block-${index}`;

        if (row.type === 'heading') {
          const style = row.level === 1 ? typography.heading : typography.label;
          return (
            <Text key={key} style={[base, style, styles.heading]}>
              {renderInline(row.text, key, [base, style])}
            </Text>
          );
        }

        if (row.type === 'paragraph') {
          return (
            <Text key={key} style={[base, styles.paragraph]}>
              {renderInline(row.text, key, base)}
            </Text>
          );
        }

        return (
          <View key={key} style={styles.list}>
            {row.items.map((item, itemIndex) => (
              <View key={`${key}-${itemIndex}`} style={styles.listRow}>
                <Text style={[base, styles.marker]}>
                  {row.type === 'numbers' ? `${itemIndex + 1}.` : '·'}
                </Text>
                <Text style={[base, styles.listText]}>
                  {renderInline(item, `${key}-${itemIndex}`, base)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xs },
  paragraph: { marginBottom: 2 },
  heading: { marginTop: space.xs, fontWeight: '700' },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: {
    fontFamily: 'monospace',
    backgroundColor: colors.line,
    borderRadius: radius.sm,
  },
  list: { gap: 2 },
  listRow: { flexDirection: 'row', gap: space.sm },
  marker: { width: 16 },
  listText: { flex: 1 },
  coachText: { ...typography.body, color: colors.ink },
  userText: { ...typography.body, color: colors.ink },
});

export default Markdown;
