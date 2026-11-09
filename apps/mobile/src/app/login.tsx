import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { BrandHero } from '@/components/brand-hero';
import { Button } from '@/components/button';
import { GoogleIcon } from '@/components/google-icon';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
});

type LoginForm = z.infer<typeof loginSchema>;

const SUBTITLE =
  "Sign in with your email. We'll send you a magic link — no password needed.";

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isWide } = useBreakpoint();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const onSubmit = async (_values: LoginForm) => {
    setSubmitting(true);
    // TODO: request a magic link from the backend, then route to a "check your inbox" screen.
    setSubmitting(false);
  };

  const onGoogle = () => { /* TODO: start Google OAuth flow */ };

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
      <Text style={[styles.backGlyph, { color: theme.text }]}>‹</Text>
    </Pressable>
  );

  const oauthSection = (
    <>
      <Button
        label="Continue with Google"
        variant="secondary"
        icon={<GoogleIcon size={20} />}
        onPress={onGoogle}
      />
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>
    </>
  );

  const emailField = (
    <>
      <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={() => handleSubmit(onSubmit)()}
            placeholder="you@example.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="go"
            style={[
              styles.input,
              { backgroundColor: theme.surface, color: theme.text },
            ]}
          />
        )}
      />
      {errors.email ? (
        <Text style={[styles.error, { color: theme.danger }]}>
          {errors.email.message}
        </Text>
      ) : null}
    </>
  );

  const submitButton = (
    <Button
      label="Send Magic Link"
      loading={submitting}
      onPress={() => handleSubmit(onSubmit)()}
      style={styles.submit}
    />
  );

  const banner = (
    <View style={[styles.banner, { backgroundColor: theme.infoSurface }]}>
      <View style={[styles.dot, { backgroundColor: theme.infoAccent }]} />
      <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
        Link expires in 10 minutes.
      </Text>
    </View>
  );

  if (isWide) {
    return (
      <View style={[styles.wideRoot, { backgroundColor: theme.background }]}>
        <BrandHero />

        <View style={styles.panel}>
          <View style={styles.panelContent}>
            {backButton}
            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>

            <View style={styles.panelTopSpacer} />
            <Text style={[styles.subtitleWide, { color: theme.textSecondary }]}>
              {SUBTITLE}
            </Text>

            <View style={styles.panelMidSpacer} />
            {oauthSection}
            {emailField}
            {submitButton}
            {banner}

            <View style={styles.panelBottomSpacer} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {backButton}
        <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {SUBTITLE}
        </Text>

        <View style={styles.spacer} />
        {oauthSection}
        {emailField}
        {submitButton}
        {banner}

        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ----- Shared -----
  back: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 30,
    lineHeight: 30,
    fontWeight: 400,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 700,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: 600,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: 500,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  submit: {
    marginTop: 16,
  },
  banner: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 600,
  },

  // ----- Mobile (stacked) -----
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 500,
  },
  spacer: {
    flex: 1,
  },
  bottomSpacer: {
    flex: 1,
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
    paddingVertical: 56,
  },
  panelContent: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
  },
  panelTopSpacer: {
    flex: 1.6,
  },
  subtitleWide: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 500,
    textAlign: 'center',
  },
  panelMidSpacer: {
    flex: 1.2,
  },
  panelBottomSpacer: {
    flex: 1.3,
  },
});
