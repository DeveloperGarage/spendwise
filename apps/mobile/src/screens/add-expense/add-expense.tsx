import {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';

import {Button} from '@/components/button';
import {Dropdown} from '@/components/dropdown';
import {TextButton} from '@/components/text-button';
import {useTheme} from '@/hooks/use-theme';
import {formatRupees, groupIndian} from '@/lib/money';
import {splitEqually} from '@/lib/split';
import {createStyles} from './add-expense.styles';
import {PageHeader, SafeArea, ScreenContainer, TextField} from "@/custom-elements";
import {saveExpense} from "@/lib/api/expense";
import {PostExpense} from "@/domain/models/postExpense";
import {getGroupsForUser} from "@/lib/api/groups";
import {Groups} from "@/domain/models/group";
import {useGoBack} from "@/hooks/use-go-back";
import {getMembersForGroup} from "@/lib/api/members";
import {Member} from "@/domain/models/members";
import {useMe} from "@/lib/session";

type SplitMode = 'equally' | 'exact' | 'percent';

const SPLIT_MODES: { key: SplitMode; label: string }[] = [
  { key: 'equally', label: 'Equally' },
  { key: 'exact', label: 'Exact' },
  { key: 'percent', label: '%' },
];

export function AddExpenseScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: me } = useMe();

  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Groups>([]);

  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [amount, setAmount] = useState(1200);
  const [description, setDescription] = useState("Dinner at Britto's");
  const [paidBy, setPaidBy] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equally');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getGroupsForUser().then(setGroups).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    getMembersForGroup(selectedGroupId).then(setGroupMembers).catch(console.error);
  }, [selectedGroupId]);

  const members = useMemo<Member[]>(() => {
    const base = selectedGroupId ? groupMembers : me ? [me] : [];
    return base.map((member) =>
      me && member.id === me.id ? { ...member, displayName: 'You' } : member,
    );
  }, [selectedGroupId, groupMembers, me]);

  const isMemberSelected = useCallback(
    (id: string) => selected[id] ?? true,
    [selected],
  );

  const effectivePaidBy = paidBy || me?.id || '';

  const groupOptions = useMemo(
    () => groups.map((group) => ({ id: group.id, label: group.name })),
    [groups],
  );

  const payeeOptions = useMemo(
    () => members.map((member) => ({id: member.id, label: member.displayName})),
    [members],
  );

  // Equal split across the selected members; everyone else owes nothing.
  // TODO: support the Exact and % modes with per-member inputs.
  const shares = useMemo(() => {
    const selectedIds = members.filter((m) => isMemberSelected(m.id)).map((m) => m.id);
    const amounts = splitEqually(amount, selectedIds.length);
    const byId: Record<string, number> = {};
    selectedIds.forEach((id, index) => {
      byId[id] = amounts[index];
    });
    return byId;
  }, [amount, members, isMemberSelected]);

  const onAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmount(digits ? Number(digits) : 0);
  };

  const onGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  }

  const toggleMember = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const createExpenseObject = (): PostExpense => {
    return {
      amount,
      note: description,
      occurredOn: new Date().toISOString(),
      categoryId: 'others', // TODO: support category selection
      fundingLines: [{memberId: effectivePaidBy, amount }],
      split: { mode: splitMode, memberIds: Object.keys(shares) },
    };
  };

  const goBack = useGoBack();
  const onCancel =  goBack;
  const onSave = () => {
    saveExpense(createExpenseObject(), selectedGroupId!).then(goBack).catch(console.error);
  };

  return (
    <SafeArea>
      <ScreenContainer>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <PageHeader>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.headerLeft}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.headerTitle}>Add expense</Text>
            </Pressable>
            <TextButton onPress={onCancel} text="Cancel" />
          </PageHeader>

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <TextInput
              style={styles.amountInput}
              value={`₹ ${groupIndian(amount)}`}
              onChangeText={onAmountChange}
              keyboardType="number-pad"
              selectTextOnFocus
              accessibilityLabel="Expense amount"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <TextField
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown
              label="Group"
              placeholder="Select a group"
              options={groupOptions}
              selectedId={selectedGroupId}
              onSelect={onGroupSelect}
              emptyText="No groups yet"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown label="Paid by" options={payeeOptions} selectedId={effectivePaidBy} onSelect={setPaidBy} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>SPLIT</Text>
            <View style={styles.segmentGroup}>
              {SPLIT_MODES.map((mode) => {
                const active = splitMode === mode.key;
                return (
                  <Pressable
                    key={mode.key}
                    onPress={() => setSplitMode(mode.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.segment, active && styles.segmentActive]}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.membersCard}>
            {members.map((member, index) => {
              const checked = isMemberSelected(member.id);
              const share = shares[member.id] ?? 0;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => toggleMember(member.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  style={({ pressed }) => [
                    styles.memberRow,
                    index > 0 && styles.memberRowDivider,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                  </View>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={[styles.memberAmount, share === 0 && styles.memberAmountZero]}>
                    {formatRupees(share)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View>
          <Button label="Save Expense" onPress={onSave} />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
