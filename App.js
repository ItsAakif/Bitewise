import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PaperProvider, Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import store from './src/redux/store';
import paperTheme, { colors, space, typography } from './src/theme';
import { useBootstrap } from './src/app/bootstrap';

function Root() {
  const { ready, error } = useBootstrap();

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.caption}>Loading your data</Text>
      </View>
    );
  }

  return (
    <>
      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PaperProvider theme={paperTheme}>
            <StatusBar style="dark" />
            <Root />
          </PaperProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    gap: space.sm,
  },
  caption: { ...typography.caption, color: colors.inkSecondary },
  banner: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
  },
  bannerText: { ...typography.label, color: colors.ink },
});
