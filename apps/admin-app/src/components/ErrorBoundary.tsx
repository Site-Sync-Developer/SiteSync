import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: String(error) };
  }

  componentDidCatch(error: Error) {
    // Hide the splash (in case it's still showing) then surface the error
    // as a native alert that appears above everything.
    SplashScreen.hideAsync().catch(() => undefined);
    Alert.alert('App error', String(error));
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#4a026f', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Something went wrong
          </Text>
          <ScrollView>
            <Text style={{ color: '#ffcccc', fontSize: 12, fontFamily: 'monospace' }}>
              {this.state.error}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
