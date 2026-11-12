import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { TextButton } from '@/components/text-button';
import { PageHeader, SafeArea, ScreenContainer } from '@/custom-elements';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './add-group.styles';

type DraftMember = { id: string; displayName: string };

// Stand-in directory until a real member picker / contacts lookup exists.
const MEMBER_POOL: DraftMember[] = [
  { id: 'you', displayName: 'You' },
  { id: 'riya', displayName: 'Riya' },
  { id: 'sam', displayName: 'Sam' },
  { id: 'dev', displayName: 'Dev' },
  { id: 'ana', displayName: 'Ana' },
];

export function AddGroupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<DraftMember[]>([MEMBER_POOL[0]]);

  const onCancel = () => router.back();

  // TODO: open a real member picker; for now cycle through the stand-in pool.
  const onAddMember = () => {
    const next = MEMBER_POOL.find((candidate) => !members.some((m) => m.id === candidate.id));
    if (next) setMembers((prev) => [...prev, next]);
  };

  const onRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const onCreate = () => {
    // TODO: persist the group (name, description, members), then navigate to it.
    router.back();
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
              <Text style={styles.headerTitle}>Create Group</Text>
            </Pressable>
            <TextButton onPress={onCancel} text="Cancel" />
          </PageHeader>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Goa Trip"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group for?"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <Text style={styles.sectionLabel}>Members</Text>
          <View style={styles.membersCard}>
            {members.length === 0 ? (
              <Text style={styles.membersEmpty}>No members yet.</Text>
            ) : (
              members.map((member, index) => (
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
            )}
          </View>

          <Button label="+ Add Member" onPress={onAddMember} />
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Create Group" onPress={onCreate} disabled={!name.trim()} />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
