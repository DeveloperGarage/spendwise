import {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';

import {Button} from '@/components/button';
import {DateField, todayIsoDate} from '@/components/date-field';
import {Dropdown} from '@/components/dropdown';
import {TextButton} from '@/components/text-button';
import {useTheme} from '@/hooks/use-theme';
import {groupIndian} from '@/lib/money';
import {createStyles} from './add-expense.styles';
import {PageHeader, SafeArea, ScreenContainer, TextField} from "@/custom-elements";
import {saveExpense} from "@/lib/api/expense";
import {PostExpense, SplitValue} from "@/domain/models/expense";
import {getGroupsForUser} from "@/lib/api/groups";
import {Groups} from "@/domain/models/group";
import {useGoBack} from "@/hooks/use-go-back";
import {getMembersForGroup} from "@/lib/api/members";
import {Member} from "@/domain/models/members";
import {useMe} from "@/lib/session";
import {ExpenseSplitEditor} from "@/components/expense-split-editor/expense-split-editor";

function splitModeForApi(mode: SplitMode): string {
  if (mode === 'equally') return 'equal';
  if (mode === 'percent') return 'percentage';
  return 'exact';
}

export function AddExpenseScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {data: me} = useMe();

  const {groupId} = useLocalSearchParams<{ groupId?: string }>();
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Groups>([]);

  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayIsoDate);
  const [paidBy, setPaidBy] = useState('');
  const [split, setSplit] = useState<SplitValue>({splitMode: 'equal', split: []});

  // The roster the expense can be split across; the signed-in user shows as "You".
  const roster = useMemo<Member[]>(() => {
    const base = selectedGroupId ? groupMembers : me ? [me] : [];
    return base.map((member) =>
      member.id === me?.id ? {...member, displayName: 'You'} : member,
    );
  }, [selectedGroupId, groupMembers, me]);

  const effectivePaidBy = paidBy || me?.id || '';

  const groupOptions = useMemo(
    () => groups.map((group) => ({id: group.id, label: group.name})),
    [groups],
  );

  const payeeOptions = useMemo(
    () => roster.map((member) => ({id: member.id, label: member.displayName})),
    [roster],
  );

  // The expense balances only when the participant shares add up to the total.
  const splitTotal = useMemo(
    () => split.split.reduce((sum, line) => sum + line.amount, 0),
    [split],
  );

  const canSave =
    !!selectedGroupId && amount > 0 && split.split.length > 0 && splitTotal === amount;

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
    const split = Object.entries(shares).map(([memberId, splitAmount]) => ({
      memberId,
      amount: splitAmount,
    }));
    return {
      amount,
      note: description,
      occurredOn,
      categoryId: 'c_8cad895abf23b8b2', // TODO: category selection should be dynamic
      fundingLines: [{ memberId: effectivePaidBy, amount }],
      splitMode: splitModeForApi(splitMode),
      split,
    };
  };

  const goBack = useGoBack();
  const onCancel = goBack;
  const saveAttempt = useRef<{ payload: string; key: string } | null>(null);
  const onSave = () => {
    if (!canSave || !selectedGroupId) return;
    const expense = createExpenseObject();
    const payload = JSON.stringify(expense);
    if (!saveAttempt.current || saveAttempt.current.payload !== payload) {
      saveAttempt.current = {payload, key: crypto.randomUUID()};
    }
    saveExpense(expense, selectedGroupId, saveAttempt.current.key).then(goBack).catch(console.error);
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
            <DateField label="Date" value={occurredOn} onChange={setOccurredOn} />
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
