import React, { useCallback } from 'react';
import 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
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
  // Hide the splash as soon as the root view has rendered on screen.
  // Using onLayout rather than a useEffect tied to auth state, so it fires
  // even if AsyncStorage hangs and loading never resolves.
  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: '#4a026f' }}
        onLayout={onRootLayout}
      >
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
  );
}
