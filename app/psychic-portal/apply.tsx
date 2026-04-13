import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const SPECIALTIES = [
  'Tarot Reading', 'Astrology', 'Clairvoyance', 'Mediumship',
  'Love & Relationships', 'Career & Finance', 'Past Lives',
  'Dream Interpretation', 'Angel Cards', 'Numerology',
];

const READING_METHODS = [
  { id: 'chat', label: 'Live Chat', icon: 'chatbubble' },
  { id: 'phone', label: 'Phone Call', icon: 'call' },
  { id: 'video', label: 'Video Call', icon: 'videocam' },
];

export default function ApplyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['chat']);
  const [bio, setBio] = useState('');
  const [chatRate, setChatRate] = useState('2.99');
  const [phoneRate, setPhoneRate] = useState('3.99');
  const [videoRate, setVideoRate] = useState('4.99');

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleMethod = (method: string) => {
    setSelectedMethods(prev => 
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email');
      return false;
    }
    if (!experienceYears) {
      Alert.alert('Required', 'Please enter years of experience');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedSpecialties.length === 0) {
      Alert.alert('Required', 'Please select at least one specialty');
      return false;
    }
    if (selectedMethods.length === 0) {
      Alert.alert('Required', 'Please select at least one reading method');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!bio.trim() || bio.length < 50) {
      Alert.alert('Required', 'Please write at least 50 characters about yourself');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      submitApplication();
    }
  };

  const submitApplication = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/psychic-portal/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          full_name: fullName,
          email: email,
          phone: phone,
          experience_years: parseInt(experienceYears),
          specialties: selectedSpecialties,
          reading_methods: selectedMethods,
          bio: bio,
          chat_rate: parseFloat(chatRate),
          phone_rate: parseFloat(phoneRate),
          video_rate: parseFloat(videoRate),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      Alert.alert(
        'Application Submitted! 🎉',
        'Thank you for applying! We\'ll review your application and get back to you within 2-5 business days.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          value={experienceYears}
          onChangeText={setExperienceYears}
          placeholder="e.g., 5"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Your Expertise</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Specialties * (Select all that apply)</Text>
        <View style={styles.tagsGrid}>
          {SPECIALTIES.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.tagButton,
                selectedSpecialties.includes(specialty) && styles.tagButtonSelected,
              ]}
              onPress={() => toggleSpecialty(specialty)}
            >
              <Text style={[
                styles.tagText,
                selectedSpecialties.includes(specialty) && styles.tagTextSelected,
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Reading Methods * (Select all you offer)</Text>
        <View style={styles.methodsRow}>
          {READING_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethods.includes(method.id) && styles.methodCardSelected,
              ]}
              onPress={() => toggleMethod(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={28}
                color={selectedMethods.includes(method.id) ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[
                styles.methodLabel,
                selectedMethods.includes(method.id) && styles.methodLabelSelected,
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Profile & Rates</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>About You * (Min 50 characters)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell seekers about your experience, approach, and what makes you unique..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length} characters</Text>
      </View>

      <Text style={styles.ratesTitle}>Set Your Rates (Per Minute)</Text>
      <Text style={styles.ratesSubtitle}>You receive 40% of each rate</Text>

      {selectedMethods.includes('chat') && (
        <View style={styles.rateRow}>
          <View style={styles.rateIcon}>
            <Ionicons name="chatbubble" size={20} color={COLORS.chatGreen} />
          </View>
          <Text style={styles.rateLabel}>Chat Rate</Text>
          <View style={styles.rateInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.rateValue}
              value={chatRate}
              onChangeText={setChatRate}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {selectedMethods.includes('phone') && (
        <View style={styles.rateRow}>
          <View style={styles.rateIcon}>
            <Ionicons name="call" size={20} color={COLORS.phoneRose} />
          </View>
          <Text style={styles.rateLabel}>Phone Rate</Text>
          <View style={styles.rateInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.rateValue}
              value={phoneRate}
              onChangeText={setPhoneRate}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {selectedMethods.includes('video') && (
        <View style={styles.rateRow}>
          <View style={styles.rateIcon}>
            <Ionicons name="videocam" size={20} color={COLORS.videoPlum} />
          </View>
          <Text style={styles.rateLabel}>Video Rate</Text>
          <View style={styles.rateInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.rateValue}
              value={videoRate}
              onChangeText={setVideoRate}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Application</Text>
        <Text style={styles.stepIndicator}>Step {step}/3</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.nextButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 3 ? 'Submit Application' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: SPACING.sm,
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
  stepIndicator: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagButtonSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  methodsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  methodLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  methodLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  ratesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ratesSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  rateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dollarSign: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 50,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
