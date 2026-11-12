import { ComponentRef, useMemo, useRef, useState } from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useRouter} from 'expo-router';

import {Button} from '@/components/button';
import {TextButton} from '@/components/text-button';
import {PageHeader, SafeArea, ScreenContainer, TextField} from '@/custom-elements';
import {useTheme} from '@/hooks/use-theme';
import {createStyles} from './add-group.styles';
import {createGroup} from "@/lib/api/groups";
import {useGoBack} from "@/hooks/use-go-back";

type DraftMember = { id: string; displayName: string };

export function AddGroupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<DraftMember[]>([]);
  const emailInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const onCancel = useGoBack()

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const onAddEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) return;
    if (members.some((m) => m.id === normalized)) {
      setEmail('');
      emailInputRef.current?.focus();
      return;
    }
    setMembers((prev) => [...prev, {id: normalized, displayName: normalized}]);
    setEmail('');
    emailInputRef.current?.focus();
  };

  const onRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const onCreate = () => {
    const groupData = {
      name: name.trim(),
      memberEmails: members.map((m) => m.id),
    };

    createGroup(groupData).then(() => {
      router.push('/dashboard');
    }).catch(console.error);
  };

  const validCreation =  name.trim() && members.length > 1;

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
              <Text style={styles.headerTitle}>Create Group</Text>
            </Pressable>
            <TextButton onPress={onCancel} text="Cancel"/>
          </PageHeader>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="e.g. Goa Trip"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextField
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group for?"
            />
          </View>

          <Text style={styles.sectionLabel}>Members</Text>
          {members.length > 0 && ( <View style={styles.membersCard}>
          {members.map((member, index) => (
            <View
              key={member.id}
              style={[styles.memberRow, index > 0 && styles.memberRowDivider]}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.displayName.charAt(0)}</Text>
              </View>
              <Text style={styles.memberName}>{member.displayName}</Text>
              <Pressable
                onPress={() => onRemoveMember(member.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${member.displayName}`}
                hitSlop={8}>
                <Text style={styles.memberRemove}>×</Text>
              </Pressable>
            </View>
          ))
          }
        </View>)
          }
          <View style={styles.emailRow}>
            <TextField
              ref={emailInputRef}
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={onAddEmail}
              placeholder="Enter email addresses to add members"
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
              accessibilityLabel="Add member by email"
              style={({pressed}) => [
                styles.confirmButton,
                !isValidEmail(email) && styles.confirmButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.confirmButtonText}>→</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Create Group" onPress={onCreate} disabled={!validCreation}/>
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
