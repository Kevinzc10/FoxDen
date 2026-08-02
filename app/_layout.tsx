import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { FoxDenProvider } from '@/context/FoxDenContext';
import { PlanProvider } from '@/context/PlanContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-assignment"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="assignment-detail"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="foxplus"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="foxscan"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="study-planner"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="advanced-stats"
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Icon fonts — must be declared explicitly with newArchEnabled: true
    // so Expo Go loads the correct glyph files instead of falling back to
    // the system CJK font (which makes all icons look like Japanese chars).
    ...Ionicons.font,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <PlanProvider>
                <FoxDenProvider>
                  <RootLayoutNav />
                </FoxDenProvider>
              </PlanProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
