/**
 * FoxScan — AI-powered homework assistance.
 * Free: 14 scans/week. FoxPlus: unlimited.
 *
 * Architecture:
 *   App → POST /api/foxscan (api-server) → AI provider
 * The API key is never exposed to the client.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlan } from '@/context/PlanContext';
import { FoxCompanion } from '@/components/FoxCompanion';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : 'http://localhost:8080/api';

const MAX_IMAGE_SIZE_MB = 4;

interface ScanResult {
  summary: string;
  steps: string[];
  concepts: string[];
  hint: string;
}

export default function FoxScanScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, foxScanRemaining, foxScanUsesThisWeek, useFoxScan, canUse } = usePlan();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFoxPlus = plan === 'foxplus';
  const remaining = isFoxPlus ? null : foxScanRemaining;
  const atLimit = !isFoxPlus && foxScanRemaining === 0;

  const pickImage = async (useCamera: boolean) => {
    try {
      let res;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera Permission', 'Please allow camera access to use FoxScan.');
          return;
        }
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
        });
      }
      if (!res.canceled && res.assets[0]) {
        const asset = res.assets[0];
        // Basic size check (fileSize may be undefined on some platforms)
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          Alert.alert('Image Too Large', `Please choose an image under ${MAX_IMAGE_SIZE_MB}MB.`);
          return;
        }
        setImageUri(asset.uri);
        setResult(null);
        setError(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open the image picker. Please try again.');
    }
  };

  const handleScan = async () => {
    if (!imageUri) return;
    if (atLimit) return;

    // Check & record the scan use
    const allowed = await useFoxScan();
    if (!allowed) {
      Alert.alert(
        'Weekly limit reached',
        'You have used all 14 FoxScan scans this week.\nUpgrade to FoxPlus for unlimited access.',
        [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'See FoxPlus', onPress: () => router.push('/foxplus') },
        ],
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setResult(null);
    setError(null);

    try {
      // Convert image to base64 for API transmission
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const apiRes = await fetch(`${API_BASE}/foxscan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${apiRes.status}`);
      }

      const data = await apiRes.json();
      setResult(data.result);
    } catch (e: any) {
      if (e.name === 'TimeoutError') {
        setError('The scan took too long. Please try again with a clearer image.');
      } else {
        setError(e.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 16 : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>FoxScan</Text>
          {isFoxPlus ? (
            <View style={[styles.plusBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
              <Ionicons name="diamond" size={11} color={colors.primary} />
              <Text style={[styles.plusBadgeText, { color: colors.primary }]}>Plus</Text>
            </View>
          ) : (
            <Text style={[styles.usageText, { color: colors.mutedForeground }]}>
              {foxScanUsesThisWeek} / 14 used
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/foxplus')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="diamond-outline" size={22} color={isFoxPlus ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Usage bar (free only) */}
        {!isFoxPlus && (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.usageRow}>
                <Text style={[styles.usageLabel, { color: colors.foreground }]}>🦊 FoxScan Usage</Text>
                <TouchableOpacity onPress={() => router.push('/foxplus')}>
                  <Text style={[styles.upgradeLink, { color: colors.primary }]}>Get Plus →</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.usageBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.usageFill,
                    {
                      backgroundColor: atLimit ? colors.destructive : colors.primary,
                      width: `${Math.min((foxScanUsesThisWeek / 14) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.usageCount, { color: colors.mutedForeground }]}>
                {atLimit
                  ? 'All 14 scans used this week. Resets on Sunday.'
                  : `${remaining} scan${remaining === 1 ? '' : 's'} remaining this week`}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* At limit prompt */}
        {atLimit && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[styles.limitCard, { backgroundColor: colors.primary + '0F', borderColor: colors.primary + '40' }]}>
              <FoxCompanion size={80} />
              <Text style={[styles.limitTitle, { color: colors.foreground }]}>
                Your fox has used all 14 trails this week.
              </Text>
              <Text style={[styles.limitDesc, { color: colors.mutedForeground }]}>
                FoxPlus unlocks unlimited FoxScan access.
              </Text>
              <TouchableOpacity
                style={[styles.limitCta, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/foxplus')}
              >
                <Text style={[styles.limitCtaText, { color: colors.primaryForeground }]}>Unlock with FoxPlus</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Image picker */}
        {!atLimit && (
          <>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              {imageUri ? (
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.preview, { borderColor: colors.border }]}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    style={[styles.changeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => { setImageUri(null); setResult(null); setError(null); }}
                  >
                    <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
                    <Text style={[styles.changeBtnText, { color: colors.mutedForeground }]}>Change image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Scan your homework</Text>
                  <Text style={[styles.pickerDesc, { color: colors.mutedForeground }]}>
                    Take a photo or upload an image. Your fox will break it down step by step.
                  </Text>
                  <View style={styles.pickerBtns}>
                    <TouchableOpacity
                      style={[styles.pickerBtn, { backgroundColor: colors.primary }]}
                      onPress={() => pickImage(true)}
                    >
                      <Ionicons name="camera" size={18} color={colors.primaryForeground} />
                      <Text style={[styles.pickerBtnText, { color: colors.primaryForeground }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pickerBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => pickImage(false)}
                    >
                      <Ionicons name="image-outline" size={18} color={colors.foreground} />
                      <Text style={[styles.pickerBtnText, { color: colors.foreground }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Scan button */}
            {imageUri && !scanning && !result && (
              <Animated.View entering={FadeInDown.delay(50).springify()}>
                <TouchableOpacity
                  style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                  onPress={handleScan}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search" size={20} color={colors.primaryForeground} />
                  <Text style={[styles.scanBtnText, { color: colors.primaryForeground }]}>Scan with Fox AI</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Loading */}
            {scanning && (
              <Animated.View entering={FadeInDown.springify()} style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.foreground }]}>Your fox is studying…</Text>
                <Text style={[styles.loadingDesc, { color: colors.mutedForeground }]}>Breaking down the problem</Text>
              </Animated.View>
            )}

            {/* Error */}
            {error && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={[styles.errorCard, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40' }]}>
                  <Ionicons name="alert-circle-outline" size={22} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                  <TouchableOpacity onPress={() => setError(null)}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Result */}
            {result && (
              <Animated.View entering={FadeInDown.delay(50).springify()} style={{ gap: 12 }}>
                {/* Summary */}
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultLabel, { color: colors.primary }]}>🦊 What your fox found</Text>
                  <Text style={[styles.resultSummary, { color: colors.foreground }]}>{result.summary}</Text>
                </View>

                {/* Steps */}
                {result.steps.length > 0 && (
                  <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.resultLabel, { color: colors.primary }]}>📋 Steps to tackle it</Text>
                    {result.steps.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{i + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Concepts */}
                {result.concepts.length > 0 && (
                  <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.resultLabel, { color: colors.primary }]}>🧠 Concepts involved</Text>
                    <View style={styles.conceptChips}>
                      {result.concepts.map((c) => (
                        <View key={c} style={[styles.chip, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                          <Text style={[styles.chipText, { color: colors.primary }]}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Hint */}
                {result.hint && (
                  <View style={[styles.hintCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                    <Text style={[styles.hintLabel, { color: colors.accent }]}>💡 Fox Hint</Text>
                    <Text style={[styles.hintText, { color: colors.foreground }]}>{result.hint}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.scanAgainBtn, { borderColor: colors.border }]}
                  onPress={() => { setImageUri(null); setResult(null); }}
                >
                  <Text style={[styles.scanAgainText, { color: colors.mutedForeground }]}>Scan another problem</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  plusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  plusBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  usageText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  scroll: { padding: 20, gap: 14 },
  usageCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  upgradeLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  usageBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  usageFill: { height: '100%', borderRadius: 4 },
  usageCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  limitCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  limitTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  limitDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  limitCta: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  limitCtaText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  imageWrap: { gap: 10 },
  preview: { width: '100%', height: 240, borderRadius: 14, borderWidth: 1 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  changeBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  pickerCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  pickerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 8 },
  pickerDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  pickerBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 28 },
  pickerBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 32 },
  scanBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  loadingCard: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  loadingDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', gap: 10 },
  errorText: { fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  retryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resultCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  resultLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  resultSummary: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  stepText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  conceptChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  hintCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  hintLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  hintText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  scanAgainBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  scanAgainText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
