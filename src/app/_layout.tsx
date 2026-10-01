import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useIncomingAlerts } from '@/game/alerts';
import { requestPersistentStorage } from '@/game/storage';
import { registerServiceWorker } from '@/pwa/pwa';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { APP_MAX_WIDTH } from '@/ui/layout';

function Shell() {
  const { palette } = useTheme();
  useIncomingAlerts();
  useEffect(() => {
    // İlerleme kaybolmasın: tarayıcıdan bu sitenin verisini silmemesini iste
    void requestPersistentStorage();
    registerServiceWorker();
  }, []);

  return (
    <View style={[styles.outer, { backgroundColor: palette.outerBackground }]}>
      {/* Masaüstü tarayıcıda telefon genişliğinde bir sütun; telefonda tam ekran */}
      <View style={[styles.column, { backgroundColor: palette.background }]}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.background },
            animation: 'slide_from_right',
          }}
        />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: APP_MAX_WIDTH, overflow: 'hidden' },
});
