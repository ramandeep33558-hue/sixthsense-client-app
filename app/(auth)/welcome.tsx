import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Mystical cosmic video background
const VIDEO_URL = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4';

// Client App Logo (purple/orange head with spiral)
const CLIENT_LOGO_URL = "https://customer-assets.emergentagent.com/job_42069a8a-9a70-44df-94f4-f6571c6ab514/artifacts/ficttj0r_IMG_4688.jpeg";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current && !videoError) {
      videoRef.current.playAsync().catch(() => {
        setVideoError(true);
      });
    }
  }, [videoError]);

  return (
    <View style={styles.container}>
      {/* Video Background or Fallback Gradient */}
      {!videoError ? (
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL }}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          onError={() => setVideoError(true)}
        />
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e']}
          style={styles.backgroundVideo}
        />
      )}

      {/* Dark Overlay for better readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.overlay}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Go Back Button */}
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => router.push('/landing')}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>

        {/* Header with mystical icon */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image 
              source={{ uri: CLIENT_LOGO_URL }}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>Sixth Sense Psychics</Text>
          <Text style={styles.subtitle}>
            Connect with gifted psychics for guidance on love, career, and life's journey
          </Text>
        </View>

        {/* Features - Glass effect cards */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(76, 217, 100, 0.2)' }]}>
              <Ionicons name="chatbubbles" size={22} color="#4CD964" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Live Chat</Text>
              <Text style={styles.featureDesc}>Real-time text guidance</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(232, 160, 184, 0.2)' }]}>
              <Ionicons name="call" size={22} color="#E8A0B8" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Live Phone Readings</Text>
              <Text style={styles.featureDesc}>Voice calls with expert psychics</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(155, 123, 212, 0.2)' }]}>
              <Ionicons name="videocam" size={22} color="#9B7BD4" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Live Video Readings</Text>
              <Text style={styles.featureDesc}>Face-to-face sessions</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
              <Ionicons name="gift" size={22} color="#FFD700" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>$20 Free Credits</Text>
              <Text style={styles.featureDesc}>Start your journey with bonus credits</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={[styles.buttons, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9B7BD4', '#7B5BB4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 16,
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 20,
  },
  goBackText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: '#9B7BD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  buttons: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9B7BD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
});
