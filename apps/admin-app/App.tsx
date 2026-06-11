import React, { useEffect, useCallback, useState } from 'react';
import 'react-native-gesture-handler';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

// Lazy-load everything that could be crashing
let AuthProvider: any, CompanyProvider: any, useAuthContext: any;
let importError: string | null = null;

try {
  const shared = require('@sitesync/shared');
  AuthProvider = shared.AuthProvider;
  CompanyProvider = shared.CompanyProvider;
  useAuthContext = shared.useAuthContext;
} catch (e: any) {
  importError = e?.message ?? String(e);
}

function AppInner() {
  const [error, setError] = useState<string | null>(importError);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, []);

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#4a026f' }}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          💥 Startup Error
        </Text>
        <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'monospace' }}>
          {error}
        </Text>
      </ScrollView>
    );
  }

  if (!AuthProvider) {
    return (
      <View style={{ flex: 1, backgroundColor: '#4a026f', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#fff' }}>Failed to load shared module (no error message)</Text>
      </View>
    );
  }

  return (
    <AuthProvider onError={(e: any) => setError(e?.message ?? String(e))}>
      <CompanyProvider>
        <AuthConsumer timedOut={timedOut} />
      </CompanyProvider>
    </AuthProvider>
  );
}

function AuthConsumer({ timedOut }: { timedOut: boolean }) {
  const { loading } = useAuthContext();

  if (loading && timedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: '#4a026f', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>
          ⏱ Auth timed out after 10s.{'\n\n'}
          Check that EXPO_PUBLIC_API_URL is set correctly in your build.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#4a026f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12 }}>Loading auth...</Text>
      </View>
    );
  }

  // Auth resolved — render a placeholder so we know it worked
  return (
    <View style={{ flex: 1, backgroundColor: '#4a026f', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>✅ Auth loaded — replace this with RootNavigator</Text>
    </View>
  );
}

export default function App() {
  const [fatalError, setFatalError] = useState<string | null>(null);

  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  if (fatalError) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#300' }}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold' }}>Fatal Error</Text>
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>{fatalError}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onRootLayout}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppInner />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}