import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

interface PsychicCardProps {
  psychic: {
    id: string;
    name: string;
    profile_picture: string;
    description?: string;
    chat_rate: number;
    online_status: string;
    average_rating: number;
    total_readings: number;
    total_reviews?: number;
    offers_chat: boolean;
    offers_phone?: boolean;
    offers_video: boolean;
    offers_video_call?: boolean;
    specialties?: string[];
    free_chat_enabled?: boolean;
  };
  variant?: 'grid' | 'list';
}

export default function PsychicCard({ psychic, variant = 'grid' }: PsychicCardProps) {
  const router = useRouter();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return COLORS.online;
      case 'busy': return COLORS.busy;
      default: return COLORS.offline;
    }
  };

  const handlePress = () => {
    router.push(`/psychic/${psychic.id}`);
  };

  if (variant === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={handlePress} activeOpacity={0.8}>
        <Image source={{ uri: psychic.profile_picture }} style={styles.listImage} />
        {/* Status Bar */}
        <View style={[styles.listStatusBar, { backgroundColor: getStatusColor(psychic.online_status) }]} />
        
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listName} numberOfLines={1}>{psychic.name}</Text>
            <View style={styles.ratingBadgeSmall}>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.ratingTextSmall}>{psychic.average_rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Text style={styles.listSpecialty} numberOfLines={1}>
            {psychic.specialties?.[0] || 'Psychic Reader'}
          </Text>
          
          {/* Service Icons */}
          <View style={styles.serviceIcons}>
            {psychic.offers_chat && (
              <View style={styles.serviceIcon}>
                <Ionicons name="chatbubble" size={14} color={COLORS.chatGreen} />
              </View>
            )}
            {psychic.offers_phone && (
              <View style={styles.serviceIcon}>
                <Ionicons name="call" size={14} color={COLORS.phoneRose} />
              </View>
            )}
            {psychic.offers_video_call && (
              <View style={styles.serviceIcon}>
                <Ionicons name="videocam" size={14} color={COLORS.videoBlue} />
              </View>
            )}
          </View>
          
          <View style={styles.listFooter}>
            <Text style={styles.priceText}>From <Text style={styles.priceValue}>${psychic.chat_rate.toFixed(2)}</Text>/min</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid variant (default) - Large photo cards
  return (
    <TouchableOpacity style={styles.gridCard} onPress={handlePress} activeOpacity={0.85}>
      {/* Image with Rating Badge */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: psychic.profile_picture }} style={styles.gridImage} />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text style={styles.ratingText}>{psychic.average_rating.toFixed(1)}</Text>
        </View>
        
        {/* Status Bar at bottom of image */}
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(psychic.online_status) }]} />
      </View>
      
      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{psychic.name}</Text>
        <Text style={styles.specialty} numberOfLines={1}>
          {psychic.specialties?.[0] || 'Psychic Reader'}
        </Text>
        
        {/* Service Icons */}
        <View style={styles.serviceIcons}>
          {psychic.offers_chat && (
            <View style={styles.serviceIcon}>
              <Ionicons name="chatbubble" size={14} color={COLORS.chatGreen} />
            </View>
          )}
          {psychic.offers_phone && (
            <View style={styles.serviceIcon}>
              <Ionicons name="call" size={14} color={COLORS.phoneRose} />
            </View>
          )}
          {psychic.offers_video_call && (
            <View style={styles.serviceIcon}>
              <Ionicons name="videocam" size={14} color={COLORS.videoBlue} />
            </View>
          )}
        </View>
        
        <Text style={styles.price}>From <Text style={styles.priceHighlight}>${psychic.chat_rate.toFixed(2)}</Text>/min</Text>
        <Text style={styles.readings}>{psychic.total_readings.toLocaleString()} readings</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid Card Styles
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 1.1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    height: 4,
    borderRadius: 2,
  },
  cardContent: {
    padding: SPACING.md,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  specialty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  serviceIcons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  price: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  priceHighlight: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  readings: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  
  // List Card Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  listImage: {
    width: 100,
    height: 120,
    resizeMode: 'cover',
  },
  listStatusBar: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 80,
    height: 3,
    borderRadius: 1.5,
  },
  listContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  ratingBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingTextSmall: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  listSpecialty: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  priceValue: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
