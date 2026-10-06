import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { TournamentProvider } from '../features/tournament/TournamentContext';

const darkEsportsTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.primary,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={darkEsportsTheme}>
        <TournamentProvider>
          <View style={styles.rootContainer}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="login" options={{ animation: 'fade' }} />
              <Stack.Screen name="register" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="roulette" options={{ presentation: 'card' }} />
              <Stack.Screen name="assigned-club" options={{ presentation: 'card' }} />
              <Stack.Screen name="live-match" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="validation" options={{ presentation: 'card' }} />
              <Stack.Screen name="dispute" options={{ presentation: 'modal' }} />
              <Stack.Screen name="admin" options={{ presentation: 'card' }} />
            </Stack>
          </View>
        </TournamentProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
