import React, { useEffect, useCallback } from 'react';
import 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

function AppContent() {
  const { loading } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4a026f" />
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
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onRootLayout}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
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
