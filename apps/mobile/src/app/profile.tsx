import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { patchMe, type Me } from '@/lib/api';
import { useMe } from '@/lib/session';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Enter a name').max(80),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '' },
  });

  useEffect(() => {
    if (me.data?.displayName) {
      form.reset({ displayName: me.data.displayName });
    }
  }, [form, me.data?.displayName]);

  const save = useMutation({
    mutationFn: (displayName: string) => patchMe(displayName),
    onSuccess: (user) => {
      queryClient.setQueryData<Me | null>(['me'], user);
      router.replace('/dashboard' as Href);
    },
  });

  if (me.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (!me.data) {
    return <Redirect href="/" />;
  }
  if (me.data.profileCompleted) {
    return <Redirect href={'/dashboard' as Href} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>What should we call you?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          This name is how others in a group will see you. You can change it later.
        </Text>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Display name"
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />
          )}
        />
        {form.formState.errors.displayName ? (
          <Text style={[styles.error, { color: theme.negative }]}>
            {form.formState.errors.displayName.message}
          </Text>
        ) : null}
        {save.isError ? (
          <Text style={[styles.error, { color: theme.negative }]}>Could not save. Try again.</Text>
        ) : null}
        <Button
          label="Continue"
          loading={save.isPending}
          onPress={() => {
            void form.handleSubmit((values) => save.mutate(values.displayName))();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
});
