import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, SPACING, SHADOWS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import StartSessionModal from '../../src/components/StartSessionModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PsychicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [psychic, setPsychic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedService, setSelectedService] = useState<'chat' | 'phone' | 'video'>('chat');

  const balance = user?.balance || 0;

  useEffect(() => {
    fetchPsychic();
    checkFavorite();
    trackRecentlyVisited();
  }, [id]);

  const trackRecentlyVisited = async () => {
    if (!user?.id || !id) return;
    try {
      await fetch(`${BACKEND_URL}/api/users/${user.id}/recently-visited/${id}`, {
        method: 'POST',
      });
    } catch (error) {
      console.log('Error tracking visit:', error);
    }
  };

  const fetchPsychic = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/psychics/${id}`);
      if (!response.ok) throw new Error('Psychic not found');
      const data = await response.json();
      setPsychic(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load psychic profile');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/favorites/check/${id}?user_id=${user.id}`);
      const data = await response.json();
      setIsFavorite(data.is_favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to save favorites.');
      return;
    }
    try {
      if (isFavorite) {
        await fetch(`${BACKEND_URL}/api/favorites/${id}?user_id=${user.id}`, { method: 'DELETE' });
      } else {
        await fetch(`${BACKEND_URL}/api/favorites/?user_id=${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ psychic_id: id }),
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return COLORS.online;
      case 'busy': return COLORS.busy;
      default: return COLORS.offline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'busy': return 'In Session';
      default: return 'Offline';
    }
  };

  const handleStartService = (serviceType: 'chat' | 'phone' | 'video') => {
    if (psychic?.online_status !== 'online') {
      Alert.alert('Unavailable', 'This psychic is currently unavailable.');
      return;
    }
    setSelectedService(serviceType);
    setShowSessionModal(true);
  };

  const handleSessionStart = (minutes: number, serviceType: 'chat' | 'phone' | 'video') => {
    setShowSessionModal(false);
    
    const rate = serviceType === 'phone' 
      ? psychic.phone_rate 
      : serviceType === 'video' 
        ? psychic.video_call_rate 
        : psychic.chat_rate;
    
    // Navigate to chat screen with session params
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: `session-${Date.now()}`,
        psychicId: psychic.id,
        rate: rate.toString(),
        minutes: minutes.toString(),
        serviceType,
      },
    });
  };

  const handleRequestVideo = (deliveryType: 'standard' | 'emergency') => {
    router.push({
      pathname: '/question/submit',
      params: {
        psychicId: psychic.id,
        psychicName: psychic.name,
        deliveryType,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!psychic) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? COLORS.heart : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: psychic.profile_picture }} style={styles.profileImage} />
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(psychic.online_status) }]}>
              <Text style={styles.statusText}>{getStatusText(psychic.online_status)}</Text>
            </View>
          </View>

          <Text style={styles.name}>{psychic.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={COLORS.star} />
              <Text style={styles.statValue}>{psychic.average_rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>({psychic.total_reviews} reviews)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="chatbubbles" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{psychic.total_readings}</Text>
              <Text style={styles.statLabel}>readings</Text>
            </View>
          </View>
        </View>

        {/* Intro Video Section */}
        {psychic.intro_video_url && (
          <View style={styles.section}>
            <View style={styles.introVideoHeader}>
              <Ionicons name="play-circle" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Meet {psychic.name.split(' ')[0]}</Text>
            </View>
            <View style={styles.introVideoContainer}>
              <Video
                source={{ uri: psychic.intro_video_url }}
                style={styles.introVideo}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                posterSource={{ uri: psychic.profile_picture }}
                usePoster
              />
            </View>
            <Text style={styles.introVideoHint}>
              Watch this 1-minute intro to learn about their gifts
            </Text>
          </View>
        )}

        {/* Live Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Sessions (Per Minute)</Text>
          <View style={styles.liveServicesGrid}>
            {/* Chat */}
            {psychic.offers_chat && (
              <TouchableOpacity 
                style={styles.serviceCard}
                onPress={() => handleStartService('chat')}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIconBg, { backgroundColor: COLORS.chatGreen + '20' }]}>
                  <Ionicons name="chatbubble" size={24} color={COLORS.chatGreen} />
                </View>
                <Text style={styles.serviceTitle}>Live Chat</Text>
                <Text style={styles.servicePrice}>${psychic.chat_rate?.toFixed(2)}/min</Text>
              </TouchableOpacity>
            )}

            {/* Phone Call */}
            {psychic.offers_phone && (
              <TouchableOpacity 
                style={styles.serviceCard}
                onPress={() => handleStartService('phone')}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIconBg, { backgroundColor: COLORS.phoneRose + '20' }]}>
                  <Ionicons name="call" size={24} color={COLORS.phoneRose} />
                </View>
                <Text style={styles.serviceTitle}>Live Phone</Text>
                <Text style={styles.servicePrice}>${psychic.phone_rate?.toFixed(2)}/min</Text>
              </TouchableOpacity>
            )}

            {/* Video Call */}
            {psychic.offers_video_call && (
              <TouchableOpacity 
                style={styles.serviceCard}
                onPress={() => handleStartService('video')}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIconBg, { backgroundColor: COLORS.videoBlue + '20' }]}>
                  <Ionicons name="videocam" size={24} color={COLORS.videoBlue} />
                </View>
                <Text style={styles.serviceTitle}>Live Video</Text>
                <Text style={styles.servicePrice}>${psychic.video_call_rate?.toFixed(2)}/min</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recorded Video Section - App Only */}
        {psychic.offers_video && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recorded Video Answer</Text>
            <Text style={styles.sectionSubtitle}>Get a detailed personalized video response to your question</Text>
            
            {/* Install App Banner */}
            <View style={styles.installAppBanner}>
              <LinearGradient
                colors={['#6B46C1', '#9B7BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.installAppGradient}
              >
                <View style={styles.installAppContent}>
                  <View style={styles.installAppIconContainer}>
                    <Ionicons name="phone-portrait-outline" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.installAppTextContainer}>
                    <Text style={styles.installAppTitle}>Available on Mobile App</Text>
                    <Text style={styles.installAppDesc}>
                      Install our app to request recorded video readings from psychics
                    </Text>
                  </View>
                </View>
                
                <View style={styles.installAppButtons}>
                  <TouchableOpacity 
                    style={styles.appStoreButton}
                    onPress={() => {
                      // TODO: Replace with actual App Store URL
                      Alert.alert('Coming Soon', 'App will be available on the App Store soon!');
                    }}
                  >
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                    <Text style={styles.appStoreButtonText}>App Store</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.playStoreButton}
                    onPress={() => {
                      // TODO: Replace with actual Play Store URL
                      Alert.alert('Coming Soon', 'App will be available on Google Play soon!');
                    }}
                  >
                    <Ionicons name="logo-google-playstore" size={20} color="#FFFFFF" />
                    <Text style={styles.appStoreButtonText}>Google Play</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.installAppFeatures}>
                  <View style={styles.installAppFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#90EE90" />
                    <Text style={styles.installAppFeatureText}>5-min personalized videos</Text>
                  </View>
                  <View style={styles.installAppFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#90EE90" />
                    <Text style={styles.installAppFeatureText}>24hr or 1hr delivery</Text>
                  </View>
                  <View style={styles.installAppFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#90EE90" />
                    <Text style={styles.installAppFeatureText}>Save & rewatch anytime</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.description}>{psychic.description}</Text>
          </View>
        </View>

        {/* Experience & Background */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience & Background</Text>
          <View style={styles.aboutCard}>
            <View style={styles.experienceItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.experienceText}>
                {psychic.years_experience || '5+'} years of experience
              </Text>
            </View>
            <View style={styles.experienceItem}>
              <Ionicons name="school-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.experienceText}>
                Professionally trained & certified
              </Text>
            </View>
            <View style={styles.experienceItem}>
              <Ionicons name="star-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.experienceText}>
                {psychic.total_readings || '1000+'} readings completed
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.tagsContainer}>
            {psychic.specialties?.map((specialty: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topics</Text>
          <View style={styles.tagsContainer}>
            {psychic.topics?.map((topic: string, index: number) => (
              <View key={index} style={[styles.tag, styles.topicTag]}>
                <Text style={[styles.tagText, styles.topicTagText]}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push({
                pathname: '/tip',
                params: { psychicId: psychic.id, psychicName: psychic.name }
              })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.gold + '20' }]}>
                <Ionicons name="gift" size={22} color={COLORS.gold} />
              </View>
              <Text style={styles.quickActionText}>Send Tip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push({
                pathname: '/review/submit',
                params: { 
                  psychicId: psychic.id, 
                  psychicName: psychic.name,
                  psychicImage: psychic.profile_picture 
                }
              })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.star + '20' }]}>
                <Ionicons name="star" size={22} color={COLORS.star} />
              </View>
              <Text style={styles.quickActionText}>Write Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Action Button */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={[
            styles.chatButton,
            psychic.online_status !== 'online' && styles.chatButtonDisabled,
          ]}
          onPress={() => handleStartService('chat')}
          disabled={psychic.online_status !== 'online'}
        >
          <LinearGradient
            colors={
              psychic.online_status === 'online'
                ? [COLORS.primary, COLORS.primaryDark]
                : [COLORS.textMuted, COLORS.textMuted]
            }
            style={styles.chatButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="chatbubbles" size={20} color="#FFF" />
            <Text style={styles.chatButtonText}>
              {psychic.online_status === 'online' ? `Start Chat $${psychic.chat_rate}/min` : 'Offline'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Session Modal */}
      <StartSessionModal
        visible={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onStart={handleSessionStart}
        psychicName={psychic?.name || ''}
        chatRate={psychic?.chat_rate || 0}
        phoneRate={psychic?.phone_rate || 0}
        videoRate={psychic?.video_call_rate || 0}
        balance={balance}
        serviceType={selectedService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  liveServicesGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  serviceTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  servicePrice: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  recordedVideoOptions: {
    gap: SPACING.sm,
  },
  videoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoOptionUrgent: {
    borderColor: COLORS.error + '50',
  },
  videoOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  videoOptionInfo: {
    flex: 1,
  },
  videoOptionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  videoOptionDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  videoOptionPrice: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  aboutCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  experienceText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  topicTag: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '30',
  },
  topicTagText: {
    color: COLORS.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  chatButtonDisabled: {
    opacity: 0.6,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Install App Banner Styles
  installAppBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  installAppGradient: {
    padding: SPACING.lg,
  },
  installAppContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  installAppIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  installAppTextContainer: {
    flex: 1,
  },
  installAppTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  installAppDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  installAppButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  appStoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  playStoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  appStoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  installAppFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  installAppFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  installAppFeatureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  // Intro Video Styles
  introVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  introVideoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  introVideo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  introVideoHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});
