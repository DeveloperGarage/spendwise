import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { DateField, todayIsoDate } from '@/components/date-field';
import { Dropdown } from '@/components/dropdown';
import { TextButton } from '@/components/text-button';
import { PageHeader, SafeArea, ScreenContainer, TextField } from '@/custom-elements';
import { SettleSuggestion } from '@/domain/models/balances';
import { PostSettlement } from '@/domain/models/settlement';
import { useTheme } from '@/hooks/use-theme';
import { useGoBack } from '@/hooks/use-go-back';
import { ApiError } from '@/lib/api/clients';
import { getBalancesForGroup } from '@/lib/api/groups';
import { getMembersForGroup } from '@/lib/api/members';
import { saveSettlement } from '@/lib/api/settlement';
import { groupIndian } from '@/lib/money';
import { useMe } from '@/lib/session';
import { createStyles } from './settle-up.styles';

export function SettleUpScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: me } = useMe();
  const goBack = useGoBack();

  const params = useLocalSearchParams<{
    groupId?: string;
    fromMemberId?: string;
    toMemberId?: string;
    amountPaise?: string;
  }>();

  const groupId = params.groupId ?? '';

  const [fromMemberId, setFromMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [amountRupees, setAmountRupees] = useState(0);
  const [occurredOn, setOccurredOn] = useState(todayIsoDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [memberOptions, setMemberOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [members, balances] = await Promise.all([
          getMembersForGroup(groupId),
          getBalancesForGroup(groupId),
        ]);
        if (cancelled) return;

        setMemberOptions(
          members.map((member) => ({
            id: member.id,
            label: member.id === me?.id ? 'You' : member.displayName,
          })),
        );

        const suggestion: SettleSuggestion | undefined = balances.suggestion[0];
        const from =
          params.fromMemberId ?? suggestion?.fromMemberId ?? balances.members.find((m) => m.balance < 0)?.id ?? '';
        const to =
          params.toMemberId ?? suggestion?.toMemberId ?? balances.members.find((m) => m.balance > 0)?.id ?? '';

        const paiseRaw = params.amountPaise
          ? Number.parseInt(params.amountPaise, 10)
          : suggestion?.amount ?? 0;
        const rupees = Number.isFinite(paiseRaw) ? Math.trunc(paiseRaw / 100) : 0;

        setFromMemberId(from);
        setToMemberId(to);
        setAmountRupees(rupees > 0 ? rupees : 0);
      } catch {
        if (!cancelled) setError('Could not load group details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId, me?.id, params.amountPaise, params.fromMemberId, params.toMemberId]);

  const payeeOptions = memberOptions;

  const amountPaise = amountRupees * 100;
  const canSave =
    !loading &&
    !!groupId &&
    amountPaise > 0 &&
    !!fromMemberId &&
    !!toMemberId &&
    fromMemberId !== toMemberId &&
    !saving;

  const onAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmountRupees(digits ? Number(digits) : 0);
  };

  const saveAttempt = useRef<{ payload: string; key: string } | null>(null);

  const onSave = () => {
    if (!canSave) return;
    const body: PostSettlement = {
      fromMemberId,
      toMemberId,
      amount: amountPaise,
      occurredOn,
      note,
    };
    const payload = JSON.stringify(body);
    if (!saveAttempt.current || saveAttempt.current.payload !== payload) {
      saveAttempt.current = { payload, key: crypto.randomUUID() };
    }
    setSaving(true);
    setError('');
    saveSettlement(body, groupId, saveAttempt.current.key)
      .then(() => goBack())
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 422) {
          setError('Check the amount and members and try again.');
        } else if (cause instanceof ApiError && cause.status === 404) {
          setError('Group not found.');
        } else {
          setError('Could not record the payment.');
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
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.headerLeft}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.headerTitle}>Settle up</Text>
            </Pressable>
            <TextButton onPress={goBack} text="Cancel" />
          </PageHeader>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <TextInput
              style={styles.amountInput}
              value={`₹ ${groupIndian(amountRupees)}`}
              onChangeText={onAmountChange}
              keyboardType="number-pad"
              selectTextOnFocus
              editable={!loading}
              accessibilityLabel="Settlement amount"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown
              label="Paid by"
              options={payeeOptions}
              selectedId={fromMemberId}
              onSelect={setFromMemberId}
              emptyText="No members"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Dropdown
              label="Paid to"
              options={payeeOptions.filter((option) => option.id !== fromMemberId)}
              selectedId={toMemberId}
              onSelect={setToMemberId}
              emptyText="No members"
            />
          </View>

          <View style={styles.fieldBlock}>
            <DateField label="Date" value={occurredOn} onChange={setOccurredOn} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <TextField value={note} onChangeText={setNote} placeholder="UPI, cash, etc." />
          </View>
        </ScrollView>

        <View>
          <Button
            label={saving ? 'Saving…' : 'Record payment'}
            onPress={onSave}
            disabled={!canSave}
          />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}