import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext, SocketProvider, RegisterExpoPush } from '@sitesync/shared';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ChatNotificationListener } from './src/components/ChatNotificationListener';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep splash screen visible until React is ready — prevents the white-screen gap
// between the native iOS launch screen and the first React render.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

function AppContent() {
  const { loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loading]);

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
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#4a026f' }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
