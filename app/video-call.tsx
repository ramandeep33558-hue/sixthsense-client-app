import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import createAgoraRtcEngine, {
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';

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
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [agoraEngine, setAgoraEngine] = useState<IRtcEngine | null>(null);
  const [agoraAppId, setAgoraAppId] = useState<string>('');
  const [channelName, setChannelName] = useState<string>('');
  const [localUid, setLocalUid] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions for camera and microphone
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        return (
          granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    initializeAgora();
    return () => {
      cleanupAgora();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeAgora = async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Error', 'Camera and microphone permissions are required for video calls.');
        router.back();
        return;
      }

      // Get video config from backend
      const configRes = await fetch(`${BACKEND_URL}/api/video/config`);
      const config = await configRes.json();
      
      if (!config.agora_enabled) {
        // Fallback to simulated call if Agora not configured
        initiateSimulatedCall();
        return;
      }

      setAgoraAppId(config.app_id);

      // Initialize Agora engine
      const engine = createAgoraRtcEngine();
      engine.initialize({
        appId: config.app_id,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // Set up event handlers
      engine.registerEventHandler({
        onJoinChannelSuccess: (_connection, elapsed) => {
          console.log('Successfully joined channel');
          setCallStatus('connected');
        },
        onUserJoined: (_connection, uid, elapsed) => {
          console.log('Remote user joined:', uid);
          setRemoteUid(uid);
          setCallStatus('connected');
        },
        onUserOffline: (_connection, uid, reason) => {
          console.log('Remote user left:', uid);
          setRemoteUid(null);
          // End call if remote user left
          endCall();
        },
        onError: (err, msg) => {
          console.error('Agora error:', err, msg);
        },
      });

      // Enable video if video call
      if (callType === 'video') {
        engine.enableVideo();
        engine.startPreview();
      }

      setAgoraEngine(engine);
      
      // Now initiate the call
      await initiateCall(engine, config.app_id);
    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      // Fallback to simulated call
      initiateSimulatedCall();
    }
  };

  const initiateCall = async (engine: IRtcEngine, appId: string) => {
    try {
      setCallStatus('connecting');
      
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
      setChannelName(data.channel_name);
      
      // Calculate local UID (should match backend calculation)
      const uid = Math.abs(hashCode(user?.id || '')) % 100000;
      setLocalUid(uid);
      
      setCallStatus('ringing');
      
      // Join the Agora channel
      engine.joinChannel(data.caller_token, data.channel_name, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert('Connection Error', 'Failed to connect the call. Please try again.');
      router.back();
    }
  };

  const initiateSimulatedCall = async () => {
    // Fallback for when Agora is not available (web preview, etc.)
    try {
      setCallStatus('connecting');
      
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

  const cleanupAgora = async () => {
    if (agoraEngine) {
      await agoraEngine.leaveChannel();
      agoraEngine.release();
    }
  };

  // Simple hash function for generating UIDs
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        
        // Track free minutes
        if (freeMinutesRemaining > 0) {
          setFreeMinutesRemaining(prev => {
            if (prev <= 1) {
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
    
    // Leave Agora channel
    await cleanupAgora();
    
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

  const toggleMute = () => {
    if (agoraEngine) {
      agoraEngine.muteLocalAudioStream(!isMuted);
    }
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (agoraEngine && callType === 'video') {
      agoraEngine.muteLocalVideoStream(!isCameraOff);
    }
    setIsCameraOff(!isCameraOff);
  };

  const toggleSpeaker = () => {
    if (agoraEngine) {
      agoraEngine.setEnableSpeakerphone(!isSpeakerOn);
    }
    setIsSpeakerOn(!isSpeakerOn);
  };

  const switchCamera = () => {
    if (agoraEngine) {
      agoraEngine.switchCamera();
    }
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
        {/* Remote Video */}
        {callType === 'video' && remoteUid && agoraEngine ? (
          <RtcSurfaceView
            style={styles.remoteVideo}
            canvas={{ uid: remoteUid }}
          />
        ) : (
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
              <Text style={[styles.statusText, 
                callStatus === 'connected' && { color: '#4CAF50' }
              ]}>
                {renderCallStatus()}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Local Video (small preview) */}
        {callType === 'video' && !isCameraOff && agoraEngine && (
          <View style={styles.localVideoContainer}>
            <RtcSurfaceView
              style={styles.localVideo}
              canvas={{ uid: 0 }}
            />
          </View>
        )}

        {/* Rate Badge */}
        <View style={styles.rateBadge}>
          <Ionicons 
            name={callType === 'video' ? 'videocam' : 'call'} 
            size={14} 
            color="#FFD700" 
          />
          <Text style={styles.rateText}>
            {freeMinutesRemaining > 0 ? 'FREE' : `$${rate.toFixed(2)}/min`}
          </Text>
        </View>

        {/* Cost Display */}
        {callStatus === 'connected' && freeMinutesRemaining <= 0 && (
          <View style={styles.costBadge}>
            <Text style={styles.costText}>
              Session Cost: ${calculateCost().toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + SPACING.md }]}>
        {/* Control Buttons Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? 'mic-off' : 'mic'} 
              size={24} 
              color={isMuted ? '#FF4444' : '#FFFFFF'} 
            />
            <Text style={styles.controlText}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity 
              style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
              onPress={toggleCamera}
            >
              <Ionicons 
                name={isCameraOff ? 'videocam-off' : 'videocam'} 
                size={24} 
                color={isCameraOff ? '#FF4444' : '#FFFFFF'} 
              />
              <Text style={styles.controlText}>
                {isCameraOff ? 'Camera On' : 'Camera Off'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons 
              name={isSpeakerOn ? 'volume-high' : 'volume-mute'} 
              size={24} 
              color={!isSpeakerOn ? '#FF4444' : '#FFFFFF'} 
            />
            <Text style={styles.controlText}>
              {isSpeakerOn ? 'Speaker' : 'Earpiece'}
            </Text>
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={switchCamera}
            >
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* End Call Button */}
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <Ionicons name="call" size={32} color="#FFFFFF" />
        </TouchableOpacity>
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
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  psychicName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: SPACING.md,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: {
    flex: 1,
  },
  rateBadge: {
    position: 'absolute',
    top: 60,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rateText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  costBadge: {
    position: 'absolute',
    top: 100,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  costText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  controls: {
    backgroundColor: '#2d2d44',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  controlButton: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  controlText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
