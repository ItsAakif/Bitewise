import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import ListRow from '../components/ListRow';
import SectionHeader from '../components/SectionHeader';
import { APP_VERSION } from '../config/env';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { WORKOUTS } from '../data/workouts';

const AboutScreen = ({ navigation }) => (
  <ScreenScaffold title="About" subtitle={`Version ${APP_VERSION}`} onBack={() => navigation.goBack()}>
    <Card>
      <Text style={[typography.heading, styles.heading]}>What this is</Text>
      <Text style={[typography.body, styles.body]}>
        BiteWise is a nutrition and activity diary that runs on your phone. Food, water,
        workouts, goals, history, recipes and meal plans are stored locally. Nothing is
        uploaded unless this build is configured with a server or Firebase.
      </Text>
      <Text style={[typography.body, styles.body]}>
        Photo recognition and the nutritionist chat are server features. When no endpoint is
        configured, those screens say so rather than producing a guess.
      </Text>
    </Card>

    <Card>
      <Text style={[typography.heading, styles.heading]}>What is included</Text>
      <Text style={[typography.caption, styles.stat]}>{FOODS.length} foods in the catalogue</Text>
      <Text style={[typography.caption, styles.stat]}>{RECIPES.length} recipes</Text>
      <Text style={[typography.caption, styles.stat]}>{WORKOUTS.length} workouts</Text>
      <Text style={[typography.caption, styles.stat]}>7-day meal planning</Text>
      <Text style={[typography.caption, styles.stat]}>Daily, weekly and 30-day history</Text>
    </Card>

    <Card padded={false}>
      <View style={styles.listPad}>
        <SectionHeader title="Documents" />
        <ListRow
          icon="file-document-outline"
          title="Terms of use"
          subtitle="What this app does and does not promise"
          onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
        />
        <View style={styles.divider} />
        <ListRow
          icon="shield-lock-outline"
          title="Privacy"
          subtitle="What is stored, what leaves the device"
          onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
        />
        <View style={styles.divider} />
        <ListRow
          icon="lifebuoy"
          title="Support"
          subtitle="Answers to common questions"
          onPress={() => navigation.navigate('Support')}
        />
      </View>
    </Card>

    <Text style={[typography.caption, styles.footnote]}>
      Nutritional values are typical values for the stated portion, not measurements of the
      food you ate. This app does not give medical advice.
    </Text>
  </ScreenScaffold>
);

const styles = StyleSheet.create({
  heading: { color: colors.ink, marginBottom: space.sm },
  body: { color: colors.inkSecondary, marginBottom: space.sm },
  stat: { color: colors.inkSecondary, paddingVertical: 2 },
  listPad: { paddingHorizontal: space.base, paddingTop: space.base },
  divider: { height: 1, backgroundColor: colors.line },
  footnote: { color: colors.inkTertiary },
});

export default AboutScreen;
