import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [psychics, setPsychics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Fetch favorites list
      const favRes = await fetch(`${BACKEND_URL}/api/favorites/user/${user.id}`);
      const favData = await favRes.json();
      setFavorites(favData);

      // Fetch all psychics to get details
      const psyRes = await fetch(`${BACKEND_URL}/api/psychics/`);
      const psyData = await psyRes.json();
      setPsychics(psyData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const removeFavorite = async (psychicId: string) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this psychic from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BACKEND_URL}/api/favorites/${psychicId}?user_id=${user?.id}`, {
                method: 'DELETE',
              });
              setFavorites(prev => prev.filter(f => f.psychic_id !== psychicId));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove favorite');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return COLORS.online;
      case 'busy': return COLORS.busy;
      default: return COLORS.offline;
    }
  };

  const getFavoritePsychics = () => {
    const favoriteIds = favorites.map(f => f.psychic_id);
    return psychics.filter(p => favoriteIds.includes(p.id));
  };

  const favoritePsychics = getFavoritePsychics();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Favorites</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : favoritePsychics.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={60} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any psychic's profile to save them here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.browseButtonText}>Browse Psychics</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {favoritePsychics.map((psychic) => (
            <TouchableOpacity
              key={psychic.id}
              style={styles.psychicCard}
              onPress={() => router.push(`/psychic/${psychic.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: psychic.profile_picture }}
                    style={styles.profileImage}
                  />
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(psychic.online_status) }
                  ]} />
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.name}>{psychic.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={COLORS.star} />
                    <Text style={styles.rating}>{psychic.average_rating?.toFixed(1) || '5.0'}</Text>
                    <Text style={styles.reviews}>({psychic.total_reviews || 0})</Text>
                  </View>
                  <Text style={styles.specialties} numberOfLines={1}>
                    {psychic.specialties?.slice(0, 2).join(' • ') || 'Psychic Reading'}
                  </Text>
                  <Text style={styles.rate}>
                    From ${psychic.chat_rate?.toFixed(2) || '2.99'}/min
                  </Text>
                </View>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFavorite(psychic.id)}
                  >
                    <Ionicons name="heart" size={24} color={COLORS.heart} />
                  </TouchableOpacity>
                  
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(psychic.online_status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {psychic.online_status === 'online' ? 'Online' : 
                       psychic.online_status === 'busy' ? 'Busy' : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>

              {psychic.online_status === 'online' && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => router.push(`/psychic/${psychic.id}`)}
                >
                  <Ionicons name="chatbubble" size={16} color="#FFF" />
                  <Text style={styles.chatButtonText}>Start Chat</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  psychicCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.backgroundCard,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviews: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  specialties: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  actionsContainer: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: SPACING.md,
    gap: 6,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
