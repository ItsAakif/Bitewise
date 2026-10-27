import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import NumberField from '../components/NumberField';
import ListRow from '../components/ListRow';
import Chip from '../components/Chip';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import {
  updateProfileField,
  updateTargets,
  updateStats,
  updateAiSettings,
  toggleDiet,
  setHomeCards,
  restoreRdaDefaults,
} from '../redux/slices/userSlice';
import { MICRO_UNITS } from '../data/micros';
import { rdaDescription } from '../data/indianRda';
import { healthConnectStatus, requestHealthAccess } from '../services/healthConnect';
import { PROVIDERS, readConfig, listFreeModels } from '../services/aiProvider';
import { signOutUser, deleteAccount, updateAccount } from '../redux/slices/authSlice';
import { DIET_TAGS } from '../data/foods';
import { APP_VERSION } from '../config/env';

const MICRO_FIELDS = [
  { key: 'fiber', label: 'Fibre', min: 0, max: 100, step: 1 },
  { key: 'calcium', label: 'Calcium', min: 0, max: 3000, step: 50 },
  { key: 'iron', label: 'Iron', min: 0, max: 100, step: 1 },
  { key: 'zinc', label: 'Zinc', min: 0, max: 100, step: 1 },
  { key: 'vitaminC', label: 'Vitamin C', min: 0, max: 1000, step: 5 },
  { key: 'vitaminB12', label: 'Vitamin B12', min: 0, max: 100, step: 0.1 },
  { key: 'folate', label: 'Folate', min: 0, max: 1500, step: 10 },
  { key: 'vitaminD', label: 'Vitamin D', min: 0, max: 100, step: 1 },
];

const HOME_CARD_OPTIONS = [
  { id: 'score', label: 'Score' },
  { id: 'calories', label: 'Calories' },
  { id: 'fasting', label: 'Eating window' },
  { id: 'macros', label: 'Macros' },
  { id: 'water', label: 'Water' },
  { id: 'history', label: 'History' },
  { id: 'meals', label: 'Meals' },
];

const TARGET_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', min: 800, max: 6000, step: 50 },
  { key: 'protein', label: 'Protein', unit: 'g', min: 0, max: 400, step: 5 },
  { key: 'carbs', label: 'Carbohydrate', unit: 'g', min: 0, max: 800, step: 10 },
  { key: 'fat', label: 'Fat', unit: 'g', min: 0, max: 300, step: 5 },
  { key: 'water', label: 'Water', unit: 'ml', min: 500, max: 6000, step: 250 },
  { key: 'steps', label: 'Steps', unit: 'steps', min: 1000, max: 30000, step: 500 },
  { key: 'sleep', label: 'Sleep', unit: 'h', min: 4, max: 12, step: 1 },
];

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);
  const [name, setName] = useState(user.name || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [health, setHealth] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiError, setAiError] = useState(false);

  const saveName = () => {
    dispatch(updateProfileField({ field: 'name', value: name.trim() }));
    if (auth.user) dispatch(updateAccount({ userId: auth.user.id, patch: { displayName: name.trim() } }));
  };

  const checkKey = async () => {
    const config = readConfig(user.settings.ai);
    if (!config.apiKey) {
      setAiStatus('Add your key first.');
      setAiError(true);
      return;
    }
    setAiBusy(true);
    setAiStatus(null);
    setAiError(false);
    try {
      const models = await listFreeModels(config);

      // Pick a usable model when the fields are still empty, so saving a key is
      // enough on its own.
      if (models.length) {
        const patch = {};
        if (!user.settings.ai?.visionModel) {
          const vision = models.find((model) => model.vision);
          if (vision) patch.visionModel = vision.id;
        }
        if (!user.settings.ai?.chatModel) {
          const chat = models.find((model) => !model.vision);
          if (chat) patch.chatModel = chat.id;
        }
        if (Object.keys(patch).length) dispatch(updateAiSettings(patch));
      }

      setAiStatus(
        models.length
          ? `Key works. ${models.length} free model${models.length === 1 ? '' : 's'} available.`
          : 'Key works, but this provider returned no free models.'
      );
    } catch (error) {
      setAiStatus(error.message || 'Could not reach the provider.');
      setAiError(true);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <ScreenScaffold title="Settings" onBack={() => navigation.goBack()}>
      <Card>
        <SectionHeader title="Profile" />
        <Input label="Display name" value={name} onChangeText={setName} autoCapitalize="words" />
        <ListRow
          icon="email-outline"
          title={user.email || auth.user?.email || 'No email on file'}
          subtitle="Email is the account identifier and cannot be changed here"
        />
        <Button label="Save profile" variant="secondary" onPress={saveName} />
      </Card>

      <Card>
        <SectionHeader title="Daily targets" />
        {TARGET_FIELDS.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            unit={field.unit}
            value={user.targets[field.key]}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(value) => dispatch(updateTargets({ [field.key]: value }))}
          />
        ))}
      </Card>

      <Card>
        <SectionHeader title="Body" />
        <NumberField
          label="Height"
          unit="cm"
          value={user.stats.height ?? 0}
          min={0}
          max={250}
          step={1}
          onChange={(value) => dispatch(updateStats({ height: value || null }))}
        />
        <NumberField
          label="Age"
          unit="years"
          value={user.stats.age ?? 0}
          min={0}
          max={120}
          step={1}
          onChange={(value) => dispatch(updateStats({ age: value || null }))}
        />
        <Text style={[typography.caption, styles.note]}>
          Height and age are recorded for your own reference. Targets are not recalculated
          from them.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Micronutrient targets" />
        <Text style={[typography.caption, styles.note]}>
          {rdaDescription({ sex: user.stats.sex, age: user.stats.age })}
        </Text>
        {MICRO_FIELDS.map((field) => (
          <NumberField
            key={field.key}
            label={`${field.label} (${MICRO_UNITS[field.key]})`}
            value={user.targets.micros?.[field.key] ?? 0}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(value) => dispatch(updateTargets({ micros: { [field.key]: value } }))}
          />
        ))}
        <Button
          label="Restore Indian RDA defaults"
          variant="secondary"
          onPress={() => dispatch(restoreRdaDefaults())}
        />
        <Text style={[typography.caption, styles.note]}>
          Population reference values, not a personal prescription. Change them if a clinician
          has given you different numbers.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="AI provider (optional)" />
        <Text style={[typography.caption, styles.note]}>
          Photo analysis and the coach work with your own key — OpenRouter has free models. No key
          ships in this app and nothing is routed through us. The key is stored on this device
          only.
        </Text>
        <View style={styles.chipWrap}>
          {Object.values(PROVIDERS).map((provider) => (
            <Chip
              key={provider.id}
              label={provider.label}
              selected={(user.settings.ai?.provider || 'openrouter') === provider.id}
              onPress={() => dispatch(updateAiSettings({ provider: provider.id }))}
            />
          ))}
        </View>
        <Input
          label="API key"
          value={user.settings.ai?.apiKey || ''}
          onChangeText={(value) => dispatch(updateAiSettings({ apiKey: value.trim() }))}
          placeholder="sk-or-v1-…"
          secureTextEntry
          helper="Stored in this device's app storage, not encrypted. Revoke it after testing."
        />
        <Input
          label="Vision model"
          value={user.settings.ai?.visionModel || ''}
          onChangeText={(value) => dispatch(updateAiSettings({ visionModel: value.trim() }))}
          placeholder="google/gemini-2.0-flash-exp:free"
        />
        <Input
          label="Chat model"
          value={user.settings.ai?.chatModel || ''}
          onChangeText={(value) => dispatch(updateAiSettings({ chatModel: value.trim() }))}
          placeholder="meta-llama/llama-3.3-70b-instruct:free"
        />
        {(user.settings.ai?.provider === 'custom') ? (
          <Input
            label="Base URL"
            value={user.settings.ai?.baseUrl || ''}
            onChangeText={(value) => dispatch(updateAiSettings({ baseUrl: value.trim() }))}
            placeholder="https://your-endpoint/v1"
          />
        ) : null}
        <Button
          label="Check key and list free models"
          variant="secondary"
          loading={aiBusy}
          onPress={checkKey}
        />
        {aiStatus ? (
          <Text style={[typography.caption, aiError ? styles.errorText : styles.statusOk]}>
            {aiStatus}
          </Text>
        ) : null}
        <Text style={[typography.caption, styles.note]}>
          Using for photos: {readConfig(user.settings.ai).visionModel || 'not set'}
          {'\n'}Using for chat: {readConfig(user.settings.ai).chatModel || 'not set'}
        </Text>
        <Button
          label="Choose from your provider's free models"
          variant="ghost"
          icon="format-list-bulleted"
          onPress={() => navigation.navigate('ModelPicker')}
        />
      </Card>

      <Card>
        <SectionHeader title="Today screen" />
        <Text style={[typography.caption, styles.note]}>
          Choose what appears, in order. Hidden cards still exist in the diary.
        </Text>
        <View style={styles.chipWrap}>
          {HOME_CARD_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={(user.settings.homeCards || []).includes(option.id)}
              onPress={() => {
                const current = user.settings.homeCards || [];
                const next = current.includes(option.id)
                  ? current.filter((id) => id !== option.id)
                  : [...current, option.id];
                dispatch(setHomeCards(next));
              }}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Diet" />
        <View style={styles.chipWrap}>
          {DIET_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={(user.preferences.diet || []).includes(tag)}
              onPress={() => dispatch(toggleDiet(tag))}
            />
          ))}
        </View>
        <Text style={[typography.caption, styles.note]}>
          Used to filter recipes and build meal plans. It does not change your targets.
        </Text>
      </Card>

      <Card padded={false}>
        <View style={styles.listPad}>
          <ListRow icon="bell-outline" title="Reminders" subtitle="Meal and water notification times" onPress={() => navigation.navigate('Notifications')} />
          <View style={styles.divider} />
          <ListRow icon="target" title="Goals" subtitle="What you are tracking" onPress={() => navigation.navigate('Goals')} />
          <View style={styles.divider} />
          <ListRow icon="chart-timeline-variant" title="Progress" subtitle="History and charts" onPress={() => navigation.navigate('Stats')} />
          <View style={styles.divider} />
          <ListRow icon="account-group-outline" title="Community" subtitle="Your journal and challenges" onPress={() => navigation.navigate('Community')} />
          <View style={styles.divider} />
          <ListRow icon="download" title="Your data" subtitle="Export a backup or restore one" onPress={() => navigation.navigate('Data')} />
          <View style={styles.divider} />
          <ListRow icon="food-apple-outline" title="Micronutrients" subtitle="Today against Indian reference intakes" onPress={() => navigation.navigate('Nutrients')} />
          <View style={styles.divider} />
          <ListRow icon="lifebuoy" title="Support" subtitle="Questions and answers" onPress={() => navigation.navigate('Support')} />
          <View style={styles.divider} />
          <ListRow icon="information-outline" title="About BiteWise" onPress={() => navigation.navigate('About')} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Health data" />
        <Text style={[typography.caption, styles.note]}>
          Reading steps from Health Connect removes the manual step entry. The app only reads;
          it never writes your diary into the system store.
        </Text>
        {health ? (
          <Text style={[typography.caption, health.granted ? styles.statusOk : styles.note]}>
            {health.granted ? 'Connected' : health.reason || 'Not connected'}
          </Text>
        ) : null}
        <Button
          label={health?.granted ? 'Check again' : 'Check availability'}
          variant="secondary"
          onPress={async () => {
            const status = await healthConnectStatus();
            setHealth(status);
            if (status.available && !status.granted) setHealth(await requestHealthAccess());
          }}
        />
      </Card>

      <Card>
        <SectionHeader title="Account" />
        <View style={styles.modeRow}>
          <Text style={[typography.body, styles.modeLabel]}>Mode</Text>
          <Badge label={auth.mode === 'local' ? 'Local device' : 'Firebase'} />
        </View>
        <Text style={[typography.caption, styles.note]}>
          {auth.mode === 'local'
            ? 'Your account, diary and posts are stored on this device only.'
            : 'Your profile and posts are stored in the configured Firebase project.'}
        </Text>
        <Button label="Sign out" variant="secondary" onPress={() => dispatch(signOutUser())} />
        {confirmDelete ? (
          <View style={styles.dangerBlock}>
            <Text style={[typography.caption, styles.dangerText]}>
              This removes the account and everything stored with it. It cannot be undone.
            </Text>
            <View style={styles.buttonRow}>
              <Button label="Delete everything" onPress={() => dispatch(deleteAccount(auth.user?.id))} />
              <Button label="Keep my account" variant="ghost" onPress={() => setConfirmDelete(false)} />
            </View>
          </View>
        ) : (
          <Button label="Delete account" variant="ghost" onPress={() => setConfirmDelete(true)} />
        )}
      </Card>

      <Text style={[typography.caption, styles.version]}>BiteWise {APP_VERSION}</Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  note: { color: colors.inkSecondary, marginTop: space.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  listPad: { paddingHorizontal: space.base, paddingVertical: space.xs },
  divider: { height: 1, backgroundColor: colors.line },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeLabel: { color: colors.ink },
  dangerBlock: { gap: space.sm, marginTop: space.sm },
  dangerText: { color: colors.danger },
  buttonRow: { flexDirection: 'row', gap: space.sm },
  statusOk: { color: colors.accent },
  errorText: { color: colors.danger },
  version: { color: colors.inkTertiary, textAlign: 'center' },
});

export default SettingsScreen;
