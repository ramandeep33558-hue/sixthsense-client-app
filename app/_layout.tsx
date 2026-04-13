import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from '../src/components/AnimatedSplash';

// Logo image - using require for local asset
const LOGO_IMAGE = require('../assets/icon.png');

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showSplash && (
        <AnimatedSplash
          onFinish={() => setShowSplash(false)}
          appName="Sixth Sense Psychics"
          tagline="Your Spiritual Journey Starts Here"
          logoSource={LOGO_IMAGE}
          gradientColors={['#1A1A2E', '#16213E', '#0F3460']}
        />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="psychic/[id]" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
