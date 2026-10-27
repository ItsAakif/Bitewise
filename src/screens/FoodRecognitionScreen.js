import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, space, radius } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { isApiConfigured } from '../config/env';
import { nutritionApi } from '../services/nutritionApi';
import { analyzeImage as analyzeWithProvider, readConfig } from '../services/aiProvider';
import { addMeal } from '../redux/slices/nutritionSlice';

const SLOT_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };

const FoodRecognitionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const aiSettings = useSelector((state) => state.user.settings.ai);

  const [image, setImage] = useState(null);
  const [items, setItems] = useState(null);
  const [unmatched, setUnmatched] = useState([]);
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [logged, setLogged] = useState(false);

  const ai = useMemo(() => readConfig(aiSettings), [aiSettings]);
  const anyConfigured = ai.ready || isApiConfigured;

  const pick = async (fromCamera) => {
    setError(null);
    setItems(null);
    setUnmatched([]);
    setNotice('');
    setLogged(false);
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError(
          fromCamera
            ? 'Camera permission was denied. You can still pick a photo from the library.'
            : 'Photo library permission was denied. You can still take a photo.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
          });

      if (!result.canceled && result.assets?.[0]?.uri) setImage(result.assets[0].uri);
    } catch (e) {
      setError(e?.message || 'Could not open the camera or library.');
    }
  };

  const analyze = async () => {
    if (!image) return;
    setStatus('loading');
    setError(null);
    setUnmatched([]);
    try {
      if (ai.ready) {
        const result = await analyzeWithProvider({ uri: image, config: ai });
        setItems(result.items);
        setUnmatched(result.unmatched);
        setNotice(result.note || '');
      } else if (isApiConfigured) {
        const result = await nutritionApi.analyzeImage(image);
        setItems(
          result.items.map((item, index) => ({
            foodId: `scan-${index}`,
            name: item.name || 'Recognised food',
            portionLabel: '1 portion',
            grams: null,
            quantity: 1,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            confidence: item.confidence,
            source: 'server',
          }))
        );
        setNotice('');
      } else {
        throw new Error('No analysis configured.');
      }
      setStatus('done');
    } catch (e) {
      setError(e?.message || 'Analysis failed.');
      setStatus('error');
    }
  };

  const log = () => {
    if (!items?.length) return;
    dispatch(
      addMeal({
        type: mealType,
        items: items.map((item, index) => ({
          id: `scan-${Date.now()}-${index}`,
          foodId: item.foodId,
          name: item.name,
          serving: '1 portion',
          quantity: item.quantity || 1,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          portionLabel: item.portionLabel,
          grams: item.grams,
        })),
      })
    );
    setLogged(true);
  };

  return (
    <ScreenScaffold title="Scan a meal" subtitle="Identify the food, then check the numbers">
      {!anyConfigured ? (
        <Card>
          <EmptyState
            icon="key-variant"
            title="No analysis configured"
            body="Add a free OpenRouter key in Settings to analyse photos with a vision model, or point the app at your own server. Until then this screen stays off rather than inventing numbers."
            action={{ label: 'Open Settings', onPress: () => navigation.navigate('Settings') }}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.badgeRow}>
            <Badge label={ai.ready ? `Your key · ${ai.providerLabel}` : 'Your server'} tone="muted" />
          </View>
          <View style={styles.buttonRow}>
            <Button label="Take a photo" icon="camera" variant="secondary" onPress={() => pick(true)} />
            <Button
              label="Choose a photo"
              icon="image-multiple"
              variant="secondary"
              onPress={() => pick(false)}
            />
          </View>

          {image ? (
            <Image source={{ uri: image }} style={styles.preview} accessibilityLabel="Selected meal photo" />
          ) : (
            <Text style={[typography.caption, styles.note]}>
              Nothing selected. The photo is sent only to the provider you configured.
            </Text>
          )}

          {image ? (
            <Button
              label={status === 'loading' ? 'Analysing…' : 'Analyse photo'}
              onPress={analyze}
              loading={status === 'loading'}
            />
          ) : null}

          {error ? <ErrorMessage message={error} onRetry={image ? analyze : undefined} /> : null}
        </Card>
      )}

      {items ? (
        <Card>
          <Text style={[typography.heading, styles.heading]}>
            {items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Nothing recognised'}
          </Text>

          {items.length === 0 ? (
            <Text style={[typography.caption, styles.note]}>
              The model did not recognise a food it could price. Try a clearer shot, or add the
              meal from the diary.
            </Text>
          ) : (
            items.map((item, index) => (
              <View key={`${item.foodId}-${index}`} style={styles.itemRow}>
                <View style={styles.itemText}>
                  <Text style={[typography.body, styles.itemName]}>{item.name}</Text>
                  <Text style={[typography.caption, styles.itemMeta]}>
                    {item.portionLabel}
                    {item.grams ? ` · ${Math.round(item.grams)} g` : ''} ·{' '}
                    {Math.round(item.calories)} kcal
                  </Text>
                </View>
                {item.confidence != null && item.confidence < 1 ? (
                  <Badge label={`${Math.round(item.confidence * 100)}%`} tone="muted" />
                ) : null}
              </View>
            ))
          )}

          {unmatched.length ? (
            <View style={styles.unmatched}>
              <Text style={[typography.label, styles.unmatchedTitle]}>Seen but not in the catalogue</Text>
              {unmatched.map((entry) => (
                <Text key={entry.name} style={[typography.caption, styles.note]}>
                  · {entry.name}
                </Text>
              ))}
              <Text style={[typography.caption, styles.note]}>
                These were left out rather than given made-up numbers.
              </Text>
            </View>
          ) : null}

          {notice ? (
            <Text style={[typography.caption, styles.note]}>{notice}</Text>
          ) : null}

          {items.length ? (
            <>
              <View style={styles.estimateBox}>
                <Text style={[typography.caption, styles.estimateTitle]}>
                  Check before you save
                </Text>
                <Text style={[typography.caption, styles.estimateBody]}>
                  Portion size is estimated from the photo. The calories come from our catalogue
                  rows, but the quantity is a guess — adjust it in the diary afterwards if it
                  looks wrong.
                </Text>
              </View>

              <Text style={[typography.label, styles.label]}>Add to</Text>
              <View style={styles.buttonRow}>
                {Object.entries(SLOT_LABEL).map(([key, label]) => (
                  <Button
                    key={key}
                    label={label}
                    variant={mealType === key ? 'primary' : 'secondary'}
                    onPress={() => setMealType(key)}
                  />
                ))}
              </View>
              <Button
                label={logged ? 'Logged to diary' : 'Log these items'}
                icon={logged ? 'check' : 'plus'}
                disabled={logged}
                onPress={log}
              />
            </>
          ) : null}
        </Card>
      ) : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', marginBottom: space.sm },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.line,
    marginTop: space.md,
  },
  note: { color: colors.inkSecondary, marginTop: space.xs },
  heading: { color: colors.ink, marginBottom: space.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  itemText: { flex: 1, gap: 2 },
  itemName: { color: colors.ink },
  itemMeta: { color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  unmatched: { marginTop: space.md, gap: 2 },
  unmatchedTitle: { color: colors.inkSecondary },
  label: { color: colors.inkSecondary, marginTop: space.md, marginBottom: space.xs },
  estimateBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.md,
    gap: space.xs,
  },
  estimateTitle: { color: colors.ink, fontWeight: '600' },
  estimateBody: { color: colors.inkSecondary },
});

export default FoodRecognitionScreen;
