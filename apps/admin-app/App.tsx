import React, { useEffect, useCallback } from 'react';
import 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AuthProvider,
  CompanyProvider,
  useAuthContext,
  SocketProvider,
  RegisterExpoPush,
} from '@sitesync/shared';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ChatNotificationListener } from './src/components/ChatNotificationListener';
import { ErrorBoundary } from './src/components/ErrorBoundary';

WebBrowser.maybeCompleteAuthSession();

// In Expo SDK 50+, the splash screen no longer auto-hides.
// preventAutoHideAsync keeps it visible until we explicitly call hideAsync.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

function AppContent() {
  const { loading } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a026f' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <SocketProvider>
        <RegisterExpoPush />
        <ChatNotificationListener />
        <RootNavigator />
      </SocketProvider>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Attempt to hide the splash and surface any error as a native alert
    // so it's visible even if the splash is covering the screen.
    SplashScreen.hideAsync().catch((e: unknown) => {
      Alert.alert(
        'Splash error',
        e instanceof Error ? e.message : String(e),
      );
    });
  }, []);

  // onLayout on the outermost View: fires after the native layout pass,
  // which is later than useEffect and acts as a reliable fallback.
  // This View sits ABOVE ErrorBoundary so it always renders regardless
  // of any child error.
  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onRootLayout}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#4a026f' }}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <CompanyProvider>
                  <AppContent />
                </CompanyProvider>
              </AuthProvider>
            </QueryClientProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </View>
  );
}
