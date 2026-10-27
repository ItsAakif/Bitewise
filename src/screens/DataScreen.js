import React, { useState } from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import { hydrateApp } from '../redux/actions';
import { addCustomFoods } from '../redux/slices/nutritionSlice';
import { parseFoodDataset, DATASET_TEMPLATE } from '../services/datasetImport';
import {
  exportToJSON,
  exportToCSV,
  importFromJSON,
  summariseImport,
  exportFileName,
} from '../services/dataTransfer';

const DataScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s);
  const account = useSelector((s) => ({ name: s.user.name, email: s.user.email }));

  const [paste, setPaste] = useState('');
  const [dataset, setDataset] = useState('');
  const [datasetPreview, setDatasetPreview] = useState(null);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const share = async (content, title, type) => {
    try {
      if (!Share || typeof Share.share !== 'function') throw new Error('no share sheet');
      const result = await Share.share({ message: content, title });
      if (result?.action === Share.dismissedAction) {
        setStatus('Share cancelled.');
        return;
      }
      setStatus(`Shared ${type}.`);
    } catch {
      // No share sheet (web, or a platform without one): put the payload in the
      // text box so it can still be copied out.
      setPaste(content);
      setStatus(`No share sheet here — the ${type} is in the box below. Select and copy it.`);
    }
  };

  const check = () => {
    setError(null);
    setStatus(null);
    const result = importFromJSON(paste);
    if (!result.ok) {
      setPreview(null);
      setError(result.error);
      return;
    }
    setPreview({ ...result, summary: summariseImport(result.data) });
  };

  const confirmImport = () => {
    if (!preview) return;
    // Hydrating replaces every account slice wholesale, which is what "restore a
    // backup" means; the user has already seen the day count before confirming.
    dispatch(hydrateApp(preview.data));
    setPreview(null);
    setPaste('');
    setStatus(`Imported ${preview.summary.days} logged days.`);
  };

  return (
    <ScreenScaffold title="Your data" subtitle="Export a copy, or restore one" onBack={() => navigation.goBack()}>
      <Card>
        <SectionHeader title="Export" />
        <Text style={[typography.caption, styles.note]}>
          A JSON backup contains everything this account has: diary and history, weight,
          workouts, goals, recipes, posts and settings. CSV contains one row per logged day.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            label="Share JSON backup"
            icon="download"
            onPress={() => share(exportToJSON(state, account), exportFileName('json'), 'JSON backup')}
          />
          <Button
            label="Share CSV"
            variant="secondary"
            icon="table"
            onPress={() => share(exportToCSV(state), exportFileName('csv'), 'CSV')}
          />
        </View>
        <Text style={[typography.caption, styles.hint]}>
          The share sheet lets you save to Files, email it, or send it to yourself.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Restore" />
        <Text style={[typography.caption, styles.note]}>
          Paste a BiteWise JSON backup below. Restoring replaces this account&apos;s current
          data — export first if you are not sure.
        </Text>
        <Input
          label="Backup JSON"
          value={paste}
          onChangeText={setPaste}
          placeholder='{"format":"bitewise-export", ...}'
          multiline
        />
        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        {preview ? (
          <View style={styles.preview}>
            <View style={styles.previewRow}>
              <Badge label={`v${preview.version}`} tone="muted" />
              <Text style={[typography.caption, styles.note]}>
                {preview.summary.days} days · {preview.summary.goals} goals
                {preview.summary.firstDate ? ` · from ${preview.summary.firstDate}` : ''}
              </Text>
            </View>
            <Button label="Replace my data with this backup" onPress={confirmImport} />
            <Button label="Cancel" variant="ghost" onPress={() => setPreview(null)} />
          </View>
        ) : (
          <Button label="Check backup" variant="secondary" onPress={check} disabled={!paste.trim()} />
        )}
      </Card>

      <Card>
        <SectionHeader title="Import a food dataset" />
        <Text style={[typography.caption, styles.note]}>
          Paste CSV or JSON to add many foods at once. This is how INDB (1,014 Indian recipes)
          or an IFCT export is used: the app does not ship those datasets because their
          redistribution terms are unconfirmed, but a copy you are licensed to use imports
          here. Rows already in your foods are skipped by name.
        </Text>
        <Button
          label="Show the column template"
          variant="ghost"
          onPress={() => setDataset(DATASET_TEMPLATE)}
        />
        <Input
          label="Dataset"
          value={dataset}
          onChangeText={setDataset}
          placeholder="name,serving,calories,protein,carbs,fat"
          multiline
        />
        {datasetPreview ? (
          <View style={styles.preview}>
            <View style={styles.previewRow}>
              <Badge label={`${datasetPreview.foods.length} foods`} />
              <Text style={[typography.caption, styles.note]}>
                {datasetPreview.total} rows read
                {datasetPreview.errors.length ? ` · ${datasetPreview.errors.length} skipped` : ''}
              </Text>
            </View>
            {datasetPreview.errors.slice(0, 4).map((error) => (
              <Text key={error} style={[typography.caption, styles.error]}>
                {error}
              </Text>
            ))}
            <Button
              label={`Add ${datasetPreview.foods.length} foods`}
              onPress={() => {
                dispatch(addCustomFoods(datasetPreview.foods));
                setDatasetStatus(`Added ${datasetPreview.foods.length} foods.`);
                setDatasetPreview(null);
                setDataset('');
              }}
            />
            <Button label="Cancel" variant="ghost" onPress={() => setDatasetPreview(null)} />
          </View>
        ) : (
          <Button
            label="Check dataset"
            variant="secondary"
            disabled={!dataset.trim()}
            onPress={() => {
              setDatasetStatus(null);
              setDatasetPreview(parseFoodDataset(dataset));
            }}
          />
        )}
        {datasetStatus ? <Text style={[typography.caption, styles.status]}>{datasetStatus}</Text> : null}
      </Card>

      {status ? <Text style={[typography.caption, styles.status]}>{status}</Text> : null}

      <Text style={[typography.caption, styles.footnote]}>
        Nothing is uploaded. Export and restore both happen on this device.
      </Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  note: { color: colors.inkSecondary, marginBottom: space.sm },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hint: { color: colors.inkTertiary, marginTop: space.sm },
  error: { color: colors.danger, marginTop: space.xs },
  preview: { gap: space.sm, marginTop: space.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  status: { color: colors.accent },
  footnote: { color: colors.inkTertiary },
});

export default DataScreen;
