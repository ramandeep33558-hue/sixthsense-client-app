import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const psychicId = params.psychicId as string;
  const psychicName = params.psychicName as string || 'Advisor';
  const callType = params.callType as string || 'video'; // video or voice
  const rate = parseFloat(params.rate as string || '4.99');
  
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(callType === 'voice');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callId, setCallId] = useState<string | null>(null);
  const [isNewClient, setIsNewClient] = useState(user?.is_new_user ?? false);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(
    isNewClient && !user?.first_reading_free_used ? 4 * 60 : 0
  );
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initiateCall();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        
        // Track free minutes
        if (freeMinutesRemaining > 0) {
          setFreeMinutesRemaining(prev => {
            if (prev <= 1) {
              // Free time ended
              showFreeTimeEndedAlert();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const initiateCall = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/video/initiate-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_id: user?.id,
          callee_id: psychicId,
          call_type: callType,
          psychic_id: psychicId,
        }),
      });
      
      const data = await response.json();
      setCallId(data.call_id);
      
      // Simulate ringing and connection
      setTimeout(() => setCallStatus('ringing'), 1000);
      setTimeout(() => setCallStatus('connected'), 3000);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert('Connection Error', 'Failed to connect the call. Please try again.');
      router.back();
    }
  };

  const showFreeTimeEndedAlert = () => {
    Alert.alert(
      'Free Time Ended',
      'Your 4 free minutes have ended. The session will now be charged at the regular rate.',
      [{ text: 'Continue', style: 'default' }]
    );
  };

  const endCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStatus('ended');
    
    if (callId) {
      try {
        await fetch(`${BACKEND_URL}/api/video/call/${callId}/end`, {
          method: 'PUT',
        });
      } catch (error) {
        console.error('Failed to end call:', error);
      }
    }
    
    // Navigate to review screen
    setTimeout(() => {
      router.replace({
        pathname: '/session-review',
        params: {
          psychicId,
          psychicName,
          sessionType: callType,
          sessionDuration: duration.toString(),
          totalSpent: calculateCost().toFixed(2),
        },
      });
    }, 1000);
  };

  const calculateCost = () => {
    const billableSeconds = Math.max(0, duration - (isNewClient ? 4 * 60 : 0));
    return (billableSeconds / 60) * rate;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallStatus = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return freeMinutesRemaining > 0 
          ? `FREE ${formatTime(freeMinutesRemaining)}`
          : formatTime(duration);
      case 'ended':
        return 'Call Ended';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
      {/* Video/Avatar Area */}
      <View style={styles.videoArea}>
        {/* Remote Video Placeholder */}
        <LinearGradient
          colors={['#2d2d44', '#1a1a2e']}
          style={styles.remoteVideo}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {psychicName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.psychicName}>{psychicName}</Text>
            <Text style={styles.callStatusText}>{renderCallStatus()}</Text>
            
            {freeMinutesRemaining > 0 && callStatus === 'connected' && (
              <View style={styles.freeBadge}>
                <Ionicons name="gift" size={14} color="#FFD700" />
                <Text style={styles.freeText}>New Client - 4 Min Free</Text>
              </View>
            )}
          </View>
        </LinearGradient>
        
        {/* Local Video Preview (for video calls) */}
        {callType === 'video' && !isCameraOff && (
          <View style={styles.localVideo}>
            <View style={[styles.localPlaceholder, { backgroundColor: colors.primary + '40' }]}>
              <Ionicons name="person" size={30} color="#FFF" />
            </View>
          </View>
        )}
      </View>

      {/* New Client Banner */}
      {isNewClient && !user?.first_reading_free_used && (
        <View style={styles.newClientBanner}>
          <Ionicons name="gift" size={16} color="#FFD700" />
          <Text style={styles.newClientText}>
            First 4 minutes FREE for new clients!
          </Text>
        </View>
      )}

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.rateText}>
          {freeMinutesRemaining > 0 
            ? '🎁 FREE' 
            : `$${rate.toFixed(2)}/min • ${callType === 'video' ? 'Video' : 'Voice'} Call`
          }
        </Text>
        {callStatus === 'connected' && (
          <Text style={styles.costText}>
            Session Cost: ${calculateCost().toFixed(2)}
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + SPACING.lg }]}>
        {/* Mute */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons 
            name={isMuted ? 'mic-off' : 'mic'} 
            size={28} 
            color={isMuted ? '#E74C3C' : '#FFF'} 
          />
          <Text style={styles.controlLabel}>Mute</Text>
        </TouchableOpacity>

        {/* Camera (video only) */}
        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
            onPress={() => setIsCameraOff(!isCameraOff)}
          >
            <Ionicons 
              name={isCameraOff ? 'videocam-off' : 'videocam'} 
              size={28} 
              color={isCameraOff ? '#E74C3C' : '#FFF'} 
            />
            <Text style={styles.controlLabel}>Camera</Text>
          </TouchableOpacity>
        )}

        {/* End Call */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={endCall}
        >
          <Ionicons name="call" size={32} color="#FFF" />
        </TouchableOpacity>

        {/* Speaker */}
        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          <Ionicons 
            name={isSpeakerOn ? 'volume-high' : 'volume-mute'} 
            size={28} 
            color="#FFF" 
          />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        {/* Flip Camera (video only) */}
        {callType === 'video' && (
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="camera-reverse" size={28} color="#FFF" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
  },
  psychicName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  callStatusText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  freeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  localPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newClientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingVertical: 10,
    gap: 8,
  },
  newClientText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  callInfo: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  rateText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  costText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: SPACING.md,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controlLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
