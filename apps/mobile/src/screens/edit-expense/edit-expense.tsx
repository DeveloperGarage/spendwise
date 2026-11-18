import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Dropdown } from '@/components/dropdown';
import { TextButton } from '@/components/text-button';
import {
  ExpenseSplitEditor,
  ExpenseSplitInitial,
} from '@/components/expense-split-editor/expense-split-editor';
import { PageHeader, SafeArea, ScreenContainer, TextField } from '@/custom-elements';
import { Category } from '@/domain/models/category';
import { PutExpense, SplitValue } from '@/domain/models/expense';
import { Member } from '@/domain/models/members';
import { useTheme } from '@/hooks/use-theme';
import { useGoBack } from '@/hooks/use-go-back';
import { ApiError } from '@/lib/api/clients';
import { getCategoriesForGroup } from '@/lib/api/categories';
import { getExpenseById, updateExpense } from '@/lib/api/expense';
import { splitInitialFromDetail } from '@/lib/expense-prefill';
import { getMembersForGroup } from '@/lib/api/members';
import { groupIndian } from '@/lib/money';
import { useMe } from '@/lib/session';
import { createStyles } from '../add-expense/add-expense.styles';

export function EditExpenseScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: me } = useMe();
  const goBack = useGoBack();

  const { groupId, expenseId } = useLocalSearchParams<{ groupId?: string; expenseId?: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [version, setVersion] = useState(1);
  const [voided, setVoided] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [groupCategories, setGroupCategories] = useState<Category[]>([]);
  const [splitInitial, setSplitInitial] = useState<ExpenseSplitInitial | undefined>();

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [split, setSplit] = useState<SplitValue>({ splitMode: 'equal', split: [], inputsValid: false });

  const roster = useMemo<Member[]>(() => {
    return groupMembers.map((member) =>
      member.id === me?.id ? { ...member, displayName: 'You' } : member,
    );
  }, [groupMembers, me]);

  const categoryOptions = useMemo(
    () => groupCategories.map((category) => ({ id: category.id, label: category.name })),
    [groupCategories],
  );

  const payeeOptions = useMemo(
    () => roster.map((member) => ({ id: member.id, label: member.displayName })),
    [roster],
  );

  const splitTotal = useMemo(
    () => split.split.reduce((sum, line) => sum + line.amount, 0),
    [split],
  );

  const canSave =
    !voided &&
    !!groupId &&
    !!expenseId &&
    !!categoryId &&
    amount > 0 &&
    split.inputsValid &&
    split.split.length > 0 &&
    splitTotal === amount;

  const applyDetail = (detail: Awaited<ReturnType<typeof getExpenseById>>, members: Member[]) => {
    setVersion(detail.version);
    setVoided(detail.voided);
    setAmount(detail.amount);
    setDescription(detail.note);
    setOccurredOn(detail.occurredOn);
    setCategoryId(detail.categoryId);
    const payer = detail.fundingLines[0]?.memberId ?? '';
    setPaidBy(payer);
    setSplitInitial(splitInitialFromDetail(detail, members.map((member) => member.id)));
  };

  const loadExpense = () => {
    if (!groupId || !expenseId) {
      setLoadError('Missing group or expense.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getExpenseById(groupId, expenseId),
      getMembersForGroup(groupId),
      getCategoriesForGroup(groupId),
    ])
      .then(([detail, members, categories]) => {
        setGroupMembers(members);
        setGroupCategories(categories.categories);
        applyDetail(detail, members);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setLoadError('Expense not found.');
        } else {
          setLoadError('Could not load expense.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, expenseId]);

  const onAmountChange = (text: string) => {
    if (voided) return;
    const digits = text.replace(/[^0-9]/g, '');
    setAmount(digits ? Number(digits) * 100 : 0);
  };

  const buildPayload = (): PutExpense => ({
    version,
    amount,
    note: description,
    occurredOn,
    categoryId,
    fundingLines: [{ memberId: paidBy, amount }],
    splitMode: split.splitMode,
    split: split.split,
  });

  const onSave = () => {
    if (!canSave || !groupId || !expenseId) return;
    setSaving(true);
    setSaveError(null);
    updateExpense(groupId, expenseId, buildPayload())
      .then(() => goBack())
      .catch(async (error) => {
        if (error instanceof ApiError && error.code === 'VERSION_CONFLICT') {
          setSaveError('This expense was updated elsewhere. Review the latest version.');
          try {
            const detail = await getExpenseById(groupId, expenseId);
            applyDetail(detail, groupMembers);
          } catch {
            setLoadError('Could not reload expense.');
          }
        } else if (error instanceof ApiError && error.code === 'VOIDED') {
          setSaveError('This expense was voided and can no longer be edited.');
          setVoided(true);
        } else {
          setSaveError('Could not save changes.');
        }
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <SafeArea>
        <ScreenContainer>
          <Text style={styles.sectionLabel}>Loading expense…</Text>
        </ScreenContainer>
      </SafeArea>
    );
  }

  if (loadError) {
    return (
      <SafeArea>
        <ScreenContainer>
          <Text style={styles.sectionLabel}>{loadError}</Text>
          <Button label="Go back" onPress={goBack} />
        </ScreenContainer>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <ScreenContainer>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PageHeader>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.headerLeft}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.headerTitle}>{voided ? 'Expense (voided)' : 'Edit expense'}</Text>
            </Pressable>
            <TextButton onPress={goBack} text="Cancel" />
          </PageHeader>

          {voided ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.sectionLabel}>This expense was voided and cannot be edited.</Text>
            </View>
          ) : null}

          {saveError ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.sectionLabel, { color: theme.negative }]}>{saveError}</Text>
            </View>
          ) : null}

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <TextInput
              style={styles.amountInput}
              editable={!voided}
              value={`₹ ${groupIndian(amount / 100)}`}
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
              onChangeText={voided ? () => {} : setDescription}
              placeholder="What was it for?"
              editable={!voided}
            />
          </View>

          <View style={styles.fieldBlock}>
            <DateField
              label="Date"
              value={occurredOn}
              onChange={voided ? () => {} : setOccurredOn}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown
              label="Category"
              options={categoryOptions}
              selectedId={categoryId}
              onSelect={voided ? () => {} : setCategoryId}
              emptyText="No categories"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown
              label="Paid by"
              options={payeeOptions}
              selectedId={paidBy}
              onSelect={voided ? () => {} : setPaidBy}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ExpenseSplitEditor
              members={roster}
              total={amount}
              onChange={setSplit}
              initial={splitInitial}
              readOnly={voided}
            />
          </View>
        </ScrollView>

        {!voided ? (
          <View>
            <Button
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={onSave}
              disabled={!canSave || saving}
            />
          </View>
        ) : null}
      </ScreenContainer>
    </SafeArea>
  );
}