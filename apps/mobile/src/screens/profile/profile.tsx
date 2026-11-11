import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { patchMe, type Me } from '@/lib/api';
import { useMe } from '@/lib/session';
import { createStyles } from './profile.styles';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Enter a name').max(80),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <View style={styles.center}>
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>
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
              style={styles.input}
            />
          )}
        />
        {form.formState.errors.displayName ? (
          <Text style={styles.error}>
            {form.formState.errors.displayName.message}
          </Text>
        ) : null}
        {save.isError ? (
          <Text style={styles.error}>Could not save. Try again.</Text>
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
