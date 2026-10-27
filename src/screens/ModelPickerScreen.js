import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, iconSize } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { updateAiSettings } from '../redux/slices/userSlice';
import { readConfig, listFreeModels } from '../services/aiProvider';

const ROLE_OPTIONS = [
  { label: 'For photos', value: 'vision' },
  { label: 'For chat', value: 'text' },
];

const ModelPickerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const aiSettings = useSelector((state) => state.user.settings.ai);
  const ai = readConfig(aiSettings);

  const [role, setRole] = useState('vision');
  const [query, setQuery] = useState('');
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const list = await listFreeModels(ai);
      setModels(list);
      setStatus('done');
    } catch (e) {
      setError(e?.message || 'Could not reach the provider.');
      setStatus('error');
    }
  }, [ai]);

  useEffect(() => {
    if (ai.apiKey && status === 'idle') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = models
    .filter((model) => (role === 'vision' ? model.vision : !model.vision))
    .filter((model) => !query.trim() || model.id.toLowerCase().includes(query.trim().toLowerCase()));

  const selectedId = role === 'vision' ? ai.visionModel : ai.chatModel;

  const choose = (model) => {
    dispatch(updateAiSettings(role === 'vision' ? { visionModel: model.id } : { chatModel: model.id }));
    navigation.goBack();
  };

  if (!ai.apiKey) {
    return (
      <ScreenScaffold title="Choose a model" onBack={() => navigation.goBack()}>
        <Card>
          <EmptyState
            icon="key-variant"
            title="Add your key first"
            body="The model list comes from your provider, so the app needs your key to ask for it."
            action={{ label: 'Open Settings', onPress: () => navigation.navigate('Settings') }}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title="Choose a model"
      subtitle={`${ai.providerLabel} · free models only`}
      onBack={() => navigation.goBack()}
      action={{ icon: 'refresh', label: 'Refresh list', onPress: load }}
    >
      <Segmented options={ROLE_OPTIONS} value={role} onChange={setRole} />

      <Card>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Filter by name"
          right={
            query ? (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear filter" hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={iconSize.sm} color={colors.inkTertiary} />
              </Pressable>
            ) : null
          }
        />
        <Text style={[typography.caption, styles.note]}>
          {role === 'vision'
            ? 'Image models read a photo and name the food.'
            : 'Text models power the coach conversation.'}
        </Text>
      </Card>

      {status === 'loading' ? <LoadingSpinner label="Asking your provider" /> : null}
      {error ? <ErrorMessage message={error} onRetry={load} /> : null}

      {status === 'done' && visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="robot-outline"
            title="No free models match"
            body={
              role === 'vision'
                ? 'Your key may not include a free image model. Enter an id manually in Settings, or check the provider dashboard.'
                : 'Your key may not include a free text model. Enter an id manually in Settings.'
            }
            action={{ label: 'Enter one manually', onPress: () => navigation.navigate('Settings') }}
          />
        </Card>
      ) : null}

      {visible.length ? (
        <Card padded={false}>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const selected = selectedId === item.id;
              return (
                <View>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => choose(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${item.id}`}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={styles.rowText}>
                      <Text style={[typography.body, styles.name]} numberOfLines={1}>
                        {item.id}
                      </Text>
                      <Text style={[typography.caption, styles.meta]} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    {selected ? (
                      <Badge label="Selected" />
                    ) : item.vision ? (
                      <MaterialCommunityIcons name="image-outline" size={iconSize.sm} color={colors.inkTertiary} />
                    ) : (
                      <MaterialCommunityIcons name="message-text-outline" size={iconSize.sm} color={colors.inkTertiary} />
                    )}
                  </Pressable>
                </View>
              );
            }}
          />
        </Card>
      ) : null}

      <Button label="Refresh the list" variant="secondary" onPress={load} loading={status === 'loading'} />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  note: { color: colors.inkSecondary, marginTop: space.xs },
  divider: { height: 1, backgroundColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    minHeight: 56,
  },
  pressed: { opacity: 0.6 },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.ink },
  meta: { color: colors.inkTertiary },
});

export default ModelPickerScreen;
