import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';

const BRAND_GRADIENT = ['#6C5CE7', '#8B7CF6'] as const;
const WIDE_BREAKPOINT = 768;

export default function LandingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const onGetStarted = () => { /* TODO: navigate to sign-up once built */ };
  const onSignIn = () => { /* TODO: navigate to sign-in once built */ };

  const signInLink = (
    <Pressable
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}
      onPress={onSignIn}>
      <Text style={[styles.signInText, { color: theme.primary }]}>I already have an account</Text>
    </Pressable>
  );

  if (isWide) {
    return (
      <View style={[styles.wideRoot, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={BRAND_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroGlyph}>₹</Text>
          </View>
          <Text style={styles.heroWordmark}>Spendwise</Text>
        </LinearGradient>

        <View style={styles.panel}>
          <View style={styles.panelContent}>
            <View style={styles.panelTopSpacer} />
            <Text style={[styles.panelTitle, { color: theme.textSecondary }]}>
              Split bills with friends and{'\n'}settle up without the awkward math.
            </Text>
            <View style={styles.panelMidSpacer} />
            <Button label="Get Started" onPress={onGetStarted} />
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              style={({ pressed }) => [styles.signInWide, pressed && styles.pressed]}
              onPress={onSignIn}>
              <Text style={[styles.signInText, { color: theme.primary }]}>
                I already have an account
              </Text>
            </Pressable>
            <View style={styles.panelBottomSpacer} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.card}>
        <View style={styles.topSpacer} />

        <LinearGradient
          colors={BRAND_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}>
          <Text style={styles.logoGlyph}>₹</Text>
        </LinearGradient>

        <View style={styles.gapSpacer} />

        <Text style={[styles.title, { color: theme.text }]}>Spendwise</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Split bills with friends and{'\n'}settle up without the awkward math.
        </Text>

        <View style={styles.bottomSpacer} />

        <Button label="Get Started" onPress={onGetStarted} />
        {signInLink}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ----- Shared -----
  signIn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  signInText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.6,
  },

  // ----- Mobile (stacked card) -----
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    maxHeight: 900,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topSpacer: {
    flex: 1.9,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 32,
  },
  gapSpacer: {
    flex: 1.5,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
    textAlign: 'center',
  },
  bottomSpacer: {
    flex: 2.7,
  },

  // ----- Desktop / wide (split screen) -----
  wideRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    padding: 48,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroGlyph: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 30,
  },
  heroWordmark: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  panel: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  panelContent: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
  },
  panelTopSpacer: {
    flex: 2.6,
  },
  panelTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 500,
    textAlign: 'center',
  },
  panelMidSpacer: {
    flex: 2.3,
  },
  signInWide: {
    alignSelf: 'flex-end',
    marginTop: 14,
    paddingVertical: 6,
  },
  panelBottomSpacer: {
    flex: 1.7,
  },
});
