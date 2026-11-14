import { ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { TextButton } from '@/components/text-button';
import { PageHeader, SafeArea, ScreenContainer, TextField } from '@/custom-elements';
import { useTheme } from '@/hooks/use-theme';
import { useGoBack } from '@/hooks/use-go-back';
import { ApiError } from '@/lib/api/clients';
import { addGroupMembers, getGroupById } from '@/lib/api/groups';
import { GroupMember } from '@/domain/models/group';
import { createStyles } from '@/screens/add-group/add-group.styles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddMembersScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const onCancel = useGoBack();

  const [existing, setExisting] = useState<GroupMember[]>([]);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const emailInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!groupId) return;
    getGroupById(groupId)
      .then((group) => setExisting(group.members ?? []))
      .catch(console.error);
  }, [groupId]);

  const existingEmails = useMemo(
    () => new Set(existing.map((member) => member.email.trim().toLowerCase())),
    [existing],
  );

  const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

  const onAddEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) return;
    if (existingEmails.has(normalized) || pending.includes(normalized)) {
      setEmail('');
      emailInputRef.current?.focus();
      return;
    }
    setPending((current) => [...current, normalized]);
    setEmail('');
    setError('');
    emailInputRef.current?.focus();
  };

  const onRemove = (address: string) => {
    setPending((current) => current.filter((item) => item !== address));
  };

  const onSave = () => {
    if (!groupId || pending.length === 0 || saving) return;
    setSaving(true);
    setError('');
    addGroupMembers(groupId, pending)
      .then(() => onCancel())
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 422) {
          setError('Each address must be allowlisted and have signed in once.');
        } else {
          setError('Could not add members.');
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <SafeArea>
      <ScreenContainer>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PageHeader>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.headerLeft}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.headerTitle}>Add members</Text>
            </Pressable>
            <TextButton onPress={onCancel} text="Cancel" />
          </PageHeader>

          <Text style={styles.sectionLabel}>Already in the group</Text>
          <View style={styles.membersCard}>
            {existing.length === 0 ? (
              <Text style={styles.membersEmpty}>No members yet.</Text>
            ) : (
              existing.map((member, index) => (
                <View
                  key={member.id}
                  style={[styles.memberRow, index > 0 && styles.memberRowDivider]}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{member.displayName.charAt(0)}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionLabel}>Add by email</Text>
          {pending.length > 0 ? (
            <View style={styles.membersCard}>
              {pending.map((address, index) => (
                <View
                  key={address}
                  style={[styles.memberRow, index > 0 && styles.memberRowDivider]}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{address.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{address}</Text>
                  <Pressable
                    onPress={() => onRemove(address)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${address}`}
                    hitSlop={8}>
                    <Text style={styles.memberRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.emailRow}>
            <TextField
              ref={emailInputRef}
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={onAddEmail}
              placeholder="name@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={onAddEmail}
              disabled={!isValidEmail(email)}
              accessibilityRole="button"
              accessibilityLabel="Add email"
              style={({ pressed }) => [
                styles.confirmButton,
                !isValidEmail(email) && styles.confirmButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.confirmButtonText}>→</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.membersEmpty}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={saving ? 'Adding…' : 'Add members'}
            onPress={onSave}
            disabled={pending.length === 0 || saving}
          />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
