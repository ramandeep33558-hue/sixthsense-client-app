import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Question {
  id: string;
  psychic_id: string;
  psychic_name?: string;
  psychic_avatar?: string;
  question_text: string;
  question_type: string;
  delivery_type: string;
  status: string;
  price: number;
  created_at: string;
  deadline: string;
  client_messages_count: number;
  psychic_messages_count: number;
}

interface Conversation {
  id: string;
  psychic_id: string;
  psychic_name: string | null;
  psychic_avatar: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  remaining_messages: number;
}

type MainTab = 'readings' | 'messages' | 'history';
type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';

export default function ReadingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [mainTab, setMainTab] = useState<MainTab>('readings');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReadings = useCallback(async () => {
    try {
      const clientId = user?.id || 'guest';
      const response = await fetch(`${BACKEND_URL}/api/questions/client/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch readings:', error);
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    try {
      const userId = user?.id || 'mock-user-123';
      const response = await fetch(`${BACKEND_URL}/api/messages/conversations/${userId}?user_type=client`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchReadings(), fetchConversations()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchReadings, fetchConversations]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAll();
  };

  const getFilteredReadings = () => {
    let filtered = questions;
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter(q => ['pending', 'accepted', 'in_progress'].includes(q.status));
        break;
      case 'completed':
        filtered = filtered.filter(q => q.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(q => ['cancelled', 'refunded'].includes(q.status));
        break;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(query) ||
        q.psychic_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const getFilteredConversations = () => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.psychic_name?.toLowerCase().includes(query) ||
      c.last_message?.toLowerCase().includes(query)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'accepted':
      case 'in_progress': return colors.info;
      case 'cancelled':
      case 'refunded': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recorded_video': return 'videocam';
      case 'live_chat': return 'chatbubble';
      case 'live_phone': return 'call';
      case 'live_video': return 'videocam';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusCounts = () => ({
    all: questions.length,
    pending: questions.filter(q => ['pending', 'accepted', 'in_progress'].includes(q.status)).length,
    completed: questions.filter(q => q.status === 'completed').length,
    cancelled: questions.filter(q => ['cancelled', 'refunded'].includes(q.status)).length,
  });

  const statusCounts = getStatusCounts();
  const unreadCount = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Activity</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElevated }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={mainTab === 'readings' ? "Search readings..." : "Search messages..."}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Tabs: Readings | Messages */}
      <View style={[styles.mainTabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'readings' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setMainTab('readings')}
        >
          <Ionicons name="book" size={18} color={mainTab === 'readings' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: mainTab === 'readings' ? colors.primary : colors.textMuted }]}>
            Readings
          </Text>
          {questions.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{questions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'messages' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setMainTab('messages')}
        >
          <Ionicons name="chatbubbles" size={18} color={mainTab === 'messages' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: mainTab === 'messages' ? colors.primary : colors.textMuted }]}>
            Messages
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setMainTab('history')}
        >
          <Ionicons name="time" size={18} color={mainTab === 'history' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: mainTab === 'history' ? colors.primary : colors.textMuted }]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Pills - Only for Readings */}
      {mainTab === 'readings' && (
        <View style={styles.filterRow}>
          {(['all', 'pending', 'completed', 'cancelled'] as StatusFilter[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                { 
                  backgroundColor: statusFilter === filter ? colors.primary : colors.backgroundElevated,
                  borderColor: statusFilter === filter ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text style={[styles.filterText, { color: statusFilter === filter ? '#FFF' : colors.textSecondary }]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({statusCounts[filter]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {mainTab === 'readings' ? (
          // Readings List
          getFilteredReadings().length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundElevated }]}>
                <Ionicons name="book-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No readings found' : 'No readings yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try a different search' : 'Book a reading to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/home')}>
                  <Text style={styles.emptyButtonText}>Find a Psychic</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            getFilteredReadings().map((reading) => (
              <TouchableOpacity
                key={reading.id}
                style={[styles.readingCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/reading/[id]', params: { id: reading.id } })}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={getTypeIcon(reading.question_type) as any} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.typeName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {reading.question_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {reading.question_text}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reading.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(reading.status) }]}>
                        {reading.status.charAt(0).toUpperCase() + reading.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(reading.created_at)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : mainTab === 'messages' ? (
          // Messages List
          getFilteredConversations().length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundElevated }]}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No messages found' : 'No messages yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try a different search' : 'Messages from readings appear here'}
              </Text>
            </View>
          ) : (
            getFilteredConversations().map((convo) => (
              <TouchableOpacity
                key={convo.id}
                style={[styles.messageCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/messages/chat/[id]', params: { id: convo.id, psychicId: convo.psychic_id, psychicName: convo.psychic_name || 'Psychic' } })}
              >
                <View style={styles.avatarContainer}>
                  {convo.psychic_avatar ? (
                    <Image source={{ uri: convo.psychic_avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>{(convo.psychic_name || 'P')[0]}</Text>
                    </View>
                  )}
                  {convo.unread_count > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                      <Text style={styles.unreadText}>{convo.unread_count}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.messageInfo}>
                  <View style={styles.messageHeader}>
                    <Text style={[styles.psychicName, { color: colors.textPrimary }]}>{convo.psychic_name || 'Psychic'}</Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(convo.last_message_time)}</Text>
                  </View>
                  <Text style={[styles.lastMessage, { color: convo.unread_count > 0 ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
                    {convo.last_message || 'No messages yet'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )
        ) : (
          // History Section - Navigate to full history screen
          <View style={styles.historySection}>
            <Text style={[styles.historySectionTitle, { color: colors.textPrimary }]}>
              View Your Complete History
            </Text>
            <Text style={[styles.historySectionDesc, { color: colors.textSecondary }]}>
              Access recordings of all your past chats, phone calls, video calls, and recorded readings.
            </Text>
            
            <TouchableOpacity
              style={[styles.historyOptionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push('/history')}
            >
              <View style={[styles.historyOptionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
              </View>
              <View style={styles.historyOptionInfo}>
                <Text style={[styles.historyOptionTitle, { color: colors.textPrimary }]}>Chat History</Text>
                <Text style={[styles.historyOptionDesc, { color: colors.textMuted }]}>View all past chat conversations</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.historyOptionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/history', params: { tab: 'calls' } })}
            >
              <View style={[styles.historyOptionIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="call" size={24} color={colors.success} />
              </View>
              <View style={styles.historyOptionInfo}>
                <Text style={[styles.historyOptionTitle, { color: colors.textPrimary }]}>Phone Call Recordings</Text>
                <Text style={[styles.historyOptionDesc, { color: colors.textMuted }]}>Listen to past phone readings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.historyOptionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/history', params: { tab: 'videos' } })}
            >
              <View style={[styles.historyOptionIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="videocam" size={24} color={colors.info} />
              </View>
              <View style={styles.historyOptionInfo}>
                <Text style={[styles.historyOptionTitle, { color: colors.textPrimary }]}>Video Call Recordings</Text>
                <Text style={[styles.historyOptionDesc, { color: colors.textMuted }]}>Watch past video readings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.historyOptionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/history', params: { tab: 'recorded' } })}
            >
              <View style={[styles.historyOptionIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="film" size={24} color={colors.warning} />
              </View>
              <View style={styles.historyOptionInfo}>
                <Text style={[styles.historyOptionTitle, { color: colors.textPrimary }]}>Recorded Readings</Text>
                <Text style={[styles.historyOptionDesc, { color: colors.textMuted }]}>Watch pre-recorded psychic answers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  mainTabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: SPACING.md },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  mainTabText: { fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 6 },
  filterPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: SPACING.md },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  emptyText: { fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  emptyButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 10 },
  emptyButtonText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  readingCard: { borderRadius: 12, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  typeIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  typeName: { fontSize: 13, fontWeight: '600' },
  questionText: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  dateText: { fontSize: 10 },
  messageCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, gap: SPACING.sm },
  avatarContainer: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  messageInfo: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  psychicName: { fontSize: 14, fontWeight: '600' },
  timeText: { fontSize: 11 },
  lastMessage: { fontSize: 12 },
  // History Section Styles
  historySection: { paddingTop: SPACING.md },
  historySectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.xs },
  historySectionDesc: { fontSize: 13, marginBottom: SPACING.lg, lineHeight: 18 },
  historyOptionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  historyOptionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  historyOptionInfo: { flex: 1 },
  historyOptionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyOptionDesc: { fontSize: 12 },
});
