import {useEffect, useMemo, useState} from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';

import { Button } from '@/components/button';
import { TextButton } from '@/components/text-button';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees, groupIndian } from '@/lib/money';
import { splitEqually } from '@/lib/split';
import { createStyles } from './add-expense.styles';
import {SafeArea, PageHeader, ScreenContainer} from "@/custom-elements";
import {saveExpense} from "@/lib/api/expense";
import {Expense} from "@/domain/models/expense";
import {getMembersForGroup} from "@/lib/api/members";
import {Group} from "@/domain/models/group";

type SplitMode = 'equally' | 'exact' | 'percent';

type Member = {
  id: string;
  name: string;
};

const SPLIT_MODES: { key: SplitMode; label: string }[] = [
  { key: 'equally', label: 'Equally' },
  { key: 'exact', label: 'Exact' },
  { key: 'percent', label: '%' },
];

const MEMBERS: Member[] = [
  { id: 'you', name: 'You' },
  { id: 'riya', name: 'Riya' },
  { id: 'sam', name: 'Sam' },
  { id: 'dev', name: 'Dev' },
];

export function AddExpenseScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { groupId } = useLocalSearchParams<{ groupId?: string }>();

  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [groups, setGroups] = useState<Group[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [amount, setAmount] = useState(1200);
  const [description, setDescription] = useState("Dinner at Britto's");
  const [paidBy, setPaidBy] = useState("you");
  const [splitMode, setSplitMode] = useState<SplitMode>('equally');
  const [selected, setSelected] = useState<Record<string, boolean>>({
    you: true,
    riya: true,
    sam: true,
    dev: false,
  });

  const selectPayee = () => { /* TODO: implement payee selection */ }
  const selectGroup = () => { /* TODO: implement group selection */ }

  // Equal split across the selected members; everyone else owes nothing.
  // TODO: support the Exact and % modes with per-member inputs.
  const shares = useMemo(() => {
    const selectedIds = MEMBERS.filter((m) => selected[m.id]).map((m) => m.id);
    const amounts = splitEqually(amount, selectedIds.length);
    const byId: Record<string, number> = {};
    selectedIds.forEach((id, index) => {
      byId[id] = amounts[index];
    });
    return byId;
  }, [amount, selected]);

  const onAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmount(digits ? Number(digits) : 0);
  };

  const toggleMember = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createExpenseObject = (): Expense => {
    return {
      amount,
      note: description,
      occurredOn: new Date().toISOString(),
      categoryId: 'others', // TODO: support category selection
      fundingLines: [{memberId: paidBy, amount }],
      split: { mode: splitMode, memberIds: Object.keys(shares) },
    };
  };

  const onCancel = () => router.back();
  const onSave = () => {
    // TODO: validate inputs

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
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.rowField, pressed && styles.pressed]}
              onPress={selectGroup}>
              <Text style={styles.rowFieldLabel}>Group</Text>
              <View style={styles.rowFieldValueWrap}>
                <Text style={styles.rowFieldValue}>Goa Trip</Text>
                <Text style={styles.chevronRight}>›</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.rowField, pressed && styles.pressed]}
              onPress={selectPayee}>
              <Text style={styles.rowFieldLabel}>Paid by</Text>
              <View style={styles.rowFieldValueWrap}>
                <Text style={styles.rowFieldValue}>{paidBy}</Text>
                <Text style={styles.chevronRight}>›</Text>
              </View>
            </Pressable>
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
            {MEMBERS.map((member, index) => {
              const checked = !!selected[member.id];
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
                  <Text style={styles.memberName}>{member.name}</Text>
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
