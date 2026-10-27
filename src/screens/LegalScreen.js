import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import { TERMS, PRIVACY } from '../data/legal';

const LegalScreen = ({ navigation, route }) => {
  const doc = route.params?.doc === 'privacy' ? 'privacy' : 'terms';
  const title = doc === 'privacy' ? 'Privacy' : 'Terms of use';
  const body = doc === 'privacy' ? PRIVACY : TERMS;

  return (
    <ScreenScaffold title={title} onBack={() => navigation.goBack()}>
      <Card>
        {body.split('\n\n').map((paragraph, index) => (
          <Text
            key={`para-${index}`}
            style={[typography.body, styles.paragraph, index === 0 && styles.lead]}
          >
            {paragraph}
          </Text>
        ))}
      </Card>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  paragraph: { color: colors.inkSecondary, marginBottom: space.md },
  lead: { color: colors.ink },
});

export default LegalScreen;
