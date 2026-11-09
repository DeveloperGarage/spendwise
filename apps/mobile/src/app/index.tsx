import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BrandHero } from '@/components/brand-hero';
import { Button } from '@/components/button';
import { GoogleIcon } from '@/components/google-icon';
import { LogoBadge } from '@/components/logo-badge';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

export default function LandingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isWide } = useBreakpoint();

  // TODO: start Google OAuth; routing straight to the dashboard for now.
  const onGoogle = () => router.push('/dashboard');

  const googleButton = (
    <Button
      label="Continue with Google"
      variant="secondary"
      icon={<GoogleIcon size={20} />}
      onPress={onGoogle}
    />
  );

  if (isWide) {
    return (
      <View style={[styles.wideRoot, { backgroundColor: theme.background }]}>
        <BrandHero />

        <View style={styles.panel}>
          <View style={styles.panelContent}>
            <View style={styles.panelTopSpacer} />
            <Text style={[styles.panelTitle, { color: theme.textSecondary }]}>
              Split bills with friends and{'\n'}settle up without the awkward math.
            </Text>
            <View style={styles.panelMidSpacer} />
            {googleButton}
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

        <LogoBadge size={64} />

        <View style={styles.gapSpacer} />

        <Text style={[styles.title, { color: theme.text }]}>Spendwise</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Split bills with friends and{'\n'}settle up without the awkward math.
        </Text>

        <View style={styles.bottomSpacer} />

        {googleButton}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  panelBottomSpacer: {
    flex: 1.7,
  },
});
