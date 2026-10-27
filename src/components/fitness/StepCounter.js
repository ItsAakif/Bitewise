// Step count. Uses the device pedometer when it is available and falls back to
// manual entry when it is not — a phone without the sensor should not turn into
// a dead panel.
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, space } from '../../theme';
import Meter from '../Meter';
import Button from '../Button';
import NumberField from '../NumberField';

export const StepCounter = ({ steps = 0, goal = 8000, available = false, onEnable, onManualEntry }) => {
  const [entry, setEntry] = useState(null);

  if (!available) {
    return (
      <View style={styles.container}>
        <Text style={[typography.body, styles.title]}>Steps</Text>
        <Text style={[typography.caption, styles.note]}>
          Step tracking needs the device motion sensor, which is not available here. Enter
          your count manually from your phone&apos;s health app.
        </Text>
        {entry === null ? (
          <Button
            label="Enter steps"
            variant="secondary"
            onPress={() => setEntry(steps || 0)}
          />
        ) : (
          <View style={styles.entry}>
            <NumberField
              label="Steps today"
              value={entry}
              onChange={setEntry}
              min={0}
              max={100000}
              step={500}
            />
            <Button
              label="Save"
              onPress={() => {
                onManualEntry?.(entry);
                setEntry(null);
              }}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Meter value={steps} target={goal} label="Steps today" />
      {onEnable ? (
        <Button label="Start step tracking" variant="secondary" onPress={onEnable} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: space.sm,
  },
  title: {
    color: colors.ink,
  },
  note: {
    color: colors.inkSecondary,
  },
  entry: {
    gap: space.md,
  },
});

export default StepCounter;
