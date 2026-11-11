import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href } from 'expo-router';

import { BrandHero } from '@/components/brand-hero';
import { Button } from '@/components/button';
import { GoogleIcon } from '@/components/google-icon';
import { LogoBadge } from '@/components/logo-badge';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { startGoogleSignIn } from '@/lib/api';
import { useMe } from '@/lib/session';
import { createStyles } from './landing.styles';

export default function LandingScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isWide } = useBreakpoint();
  const me = useMe();

  const onGoogle = () => navigation.navigate('/dashboard');

  if (me.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (me.data) {
    return <Redirect href={(me.data.profileCompleted ? '/dashboard' : '/profile') as Href} />;
  }

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
      <View style={styles.wideRoot}>
        <BrandHero />

        <View style={styles.panel}>
          <View style={styles.panelContent}>
            <View style={styles.panelTopSpacer} />
            <Text style={styles.panelTitle}>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <View style={styles.topSpacer} />

        <LogoBadge size={64} />

        <View style={styles.gapSpacer} />

        <Text style={styles.title}>Spendwise</Text>
        <Text style={styles.subtitle}>
          Split bills with friends and{'\n'}settle up without the awkward math.
        </Text>

        <View style={styles.bottomSpacer} />

        {googleButton}
      </View>
    </SafeAreaView>
  );
}
