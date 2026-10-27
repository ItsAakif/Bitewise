import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { colors, typography, space } from '../theme';
import ScreenScaffold from '../components/ScreenScaffold';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { lookupBarcode, OPEN_FOOD_FACTS_CREDIT } from '../services/openFoodFacts';
import { addCustomFood } from '../redux/slices/nutritionSlice';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'];

/** expo-camera is load-guarded: a build without the native module still works. */
function loadCamera() {
  try {
    // eslint-disable-next-line global-require
    return require('expo-camera');
  } catch {
    return null;
  }
}

const cameraModule = loadCamera();

/**
 * The camera lives in its own component so the permission hook is called
 * unconditionally from a component that is only mounted when the module exists.
 * A conditional hook in the screen would break the rules of hooks.
 */
function CameraScanner({ onScanned, torch }) {
  const [permission, requestPermission] = cameraModule.useCameraPermissions();

  if (!permission?.granted) {
    return (
      <View style={styles.permissionBox}>
        <Text style={[typography.body, styles.permissionText]}>
          Camera access is needed to read a barcode. You can also type the number below.
        </Text>
        <Button label="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <cameraModule.CameraView
      style={styles.camera}
      enableTorch={torch}
      barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
      onBarcodeScanned={onScanned}
    />
  );
}

const BarcodeScanScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const mealType = route.params?.mealType || 'snack';

  const [code, setCode] = useState('');
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [torch, setTorch] = useState(false);

  const lookUp = async (value) => {
    const clean = String(value || '').replace(/\D/g, '');
    if (clean.length < 8) {
      setError('A barcode is at least 8 digits.');
      return;
    }
    setStatus('loading');
    setError(null);
    setProduct(null);
    try {
      const found = await lookupBarcode(clean);
      if (!found) {
        setStatus('missing');
        return;
      }
      setProduct(found);
      setStatus('found');
    } catch (e) {
      setError(e?.message || 'Could not reach Open Food Facts.');
      setStatus('error');
    }
  };

  const onScanned = ({ data }) => {
    if (status === 'loading' || status === 'found') return;
    setCode(data);
    lookUp(data);
  };

  const use = () => {
    if (!product) return;
    // Saved as a custom food so the diary can reuse it offline from now on.
    dispatch(addCustomFood(product));
    navigation.replace('MealEntry', { mealType, initialFoodId: product.id });
  };

  return (
    <ScreenScaffold title="Scan a barcode" subtitle="Look up a packaged food" onBack={() => navigation.goBack()}>
      {cameraModule?.CameraView ? (
        <Card padded={false}>
          <View style={styles.cameraWrap}>
            <CameraScanner
              onScanned={status === 'found' ? undefined : onScanned}
              torch={torch}
            />
          </View>
          <View style={styles.torchRow}>
            <Button
              label={torch ? 'Turn light off' : 'Turn light on'}
              variant="ghost"
              icon={torch ? 'flashlight-off' : 'flashlight'}
              onPress={() => setTorch((v) => !v)}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={[typography.caption, styles.note]}>
            The camera module is not available in this build. Type the barcode number
            instead.
          </Text>
        </Card>
      )}

      <Card>
        <Input
          label="Barcode number"
          value={code}
          onChangeText={setCode}
          placeholder="8901234567890"
          keyboardType="numeric"
        />
        <Button
          label="Look up"
          onPress={() => lookUp(code)}
          loading={status === 'loading'}
          disabled={!code.trim()}
        />
      </Card>

      {status === 'loading' ? <LoadingSpinner label="Asking Open Food Facts" /> : null}

      {error ? <ErrorMessage message={error} onRetry={() => lookUp(code)} /> : null}

      {status === 'missing' ? (
        <Card>
          <Text style={[typography.heading, styles.heading]}>Not in Open Food Facts</Text>
          <Text style={[typography.caption, styles.note]}>
            This barcode has no entry yet. Add the food manually — the diary remembers it, and
            you can also add the product to Open Food Facts to fix it for everyone.
          </Text>
          <Button
            label="Enter it manually"
            variant="secondary"
            onPress={() => navigation.replace('MealEntry', { mealType })}
          />
        </Card>
      ) : null}

      {product ? (
        <Card>
          <View style={styles.productHeader}>
            <Text style={[typography.heading, styles.heading]} numberOfLines={2}>
              {product.name}
            </Text>
            {product.nutriscore ? (
              <Badge label={`Nutri-Score ${String(product.nutriscore).toUpperCase()}`} tone="muted" />
            ) : null}
          </View>
          <Text style={[typography.body, styles.macros]}>
            {product.calories} kcal · {product.protein} g protein · {product.carbs} g carbs ·{' '}
            {product.fat} g fat
          </Text>
          <Text style={[typography.caption, styles.serving]}>per {product.serving}</Text>
          {product.allergens?.length ? (
            <Text style={[typography.caption, styles.allergens]}>
              Allergens: {product.allergens.join(', ')}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Use this food" onPress={use} />
            <Button
              label="Scan again"
              variant="ghost"
              onPress={() => {
                setProduct(null);
                setCode('');
                setStatus('idle');
              }}
            />
          </View>
          <Text style={[typography.caption, styles.credit]}>{OPEN_FOOD_FACTS_CREDIT}</Text>
        </Card>
      ) : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  cameraWrap: { height: 260, backgroundColor: colors.line, overflow: 'hidden' },
  camera: { flex: 1 },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.base,
    gap: space.md,
  },
  permissionText: { color: colors.ink, textAlign: 'center' },
  torchRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: space.xs },
  note: { color: colors.inkSecondary, marginBottom: space.sm },
  heading: { color: colors.ink, flex: 1 },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.xs,
  },
  macros: { color: colors.ink, fontVariant: ['tabular-nums'] },
  serving: { color: colors.inkTertiary },
  allergens: { color: colors.danger, marginTop: space.xs },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  credit: { color: colors.inkTertiary, marginTop: space.md },
});

export default BarcodeScanScreen;
