import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { SplitLine } from '@/domain/models/expense';
import { Member } from '@/domain/models/members';
import { useTheme } from '@/hooks/use-theme';
import { formatPaise } from '@/lib/money';
import { createStyles } from './expense-funding-editor.styles';

export type FundingValue = {
  fundingLines: SplitLine[];
  inputsValid: boolean;
};

export type ExpenseFundingInitial = {
  selected: Record<string, boolean>;
  amounts: Record<string, number>;
};

type ExpenseFundingEditorProps = {
  members: Member[];
  total: number;
  defaultMemberId?: string;
  initial?: ExpenseFundingInitial;
  readOnly?: boolean;
  onChange: (value: FundingValue) => void;
};

export function ExpenseFundingEditor({
  members,
  total,
  defaultMemberId,
  initial,
  readOnly,
  onChange,
}: ExpenseFundingEditorProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    if (initial) return { ...initial.selected };
    if (defaultMemberId) return { [defaultMemberId]: true };
    return {};
  });
  const [amounts, setAmounts] = useState<Record<string, number>>(() => {
    if (initial) return { ...initial.amounts };
    if (defaultMemberId && total > 0) return { [defaultMemberId]: total };
    return {};
  });
  const initialKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    const key = JSON.stringify(initial);
    if (initialKeyRef.current === key) return;
    initialKeyRef.current = key;
    setSelected({ ...initial.selected });
    setAmounts({ ...initial.amounts });
  }, [initial]);

  const selectedMembers = useMemo(
    () => members.filter((member) => selected[member.id]),
    [members, selected],
  );

  useEffect(() => {
    if (selectedMembers.length !== 1 || readOnly) return;
    const only = selectedMembers[0];
    if (only && (amounts[only.id] ?? 0) !== total) {
      setAmounts((prev) => ({ ...prev, [only.id]: total }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, selectedMembers.length]);

  const value = useMemo<FundingValue>(() => {
    const fundingLines = selectedMembers
      .map((member) => ({
        memberId: member.id,
        amount: amounts[member.id] ?? 0,
      }))
      .filter((line) => line.amount > 0);

    const sum = fundingLines.reduce((part, line) => part + line.amount, 0);
    const inputsValid =
      selectedMembers.length > 0 &&
      fundingLines.length === selectedMembers.length &&
      fundingLines.every((line) => line.amount > 0) &&
      sum === total &&
      total > 0;

    return { fundingLines, inputsValid };
  }, [amounts, selectedMembers, total]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current(value);
  }, [value]);

  const toggleMember = (memberId: string) => {
    if (readOnly) return;
    setSelected((prev) => {
      const wasSelected = prev[memberId] ?? false;
      const next = { ...prev, [memberId]: !wasSelected };
      const prevCount = Object.values(prev).filter(Boolean).length;
      const nextIds = Object.keys(next).filter((id) => next[id]);
      const nextCount = nextIds.length;

      setAmounts((amountPrev) => {
        if (nextCount === 0) return {};
        if (nextCount === 1) {
          return total > 0 ? { [nextIds[0]]: total } : {};
        }
        if (prevCount <= 1) {
          const zeroed: Record<string, number> = {};
          for (const id of nextIds) zeroed[id] = 0;
          return zeroed;
        }
        if (!wasSelected) {
          return { ...amountPrev, [memberId]: 0 };
        }
        const copy = { ...amountPrev };
        delete copy[memberId];
        return copy;
      });

      return next;
    });
  };

  const onAmountText = (memberId: string, text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmounts((prev) => ({ ...prev, [memberId]: digits ? Number(digits) * 100 : 0 }));
  };

  const pickerLabel =
    selectedMembers.length === 0
      ? 'Select who paid'
      : selectedMembers.map((member) => member.displayName).join(', ');

  const sum = value.fundingLines.reduce((part, line) => part + line.amount, 0);
  const showHint = selectedMembers.length > 0 && sum !== total;

  return (
    <View>
      <Text style={styles.sectionLabel}>PAID BY</Text>
      <Pressable
        onPress={() => !readOnly && setPickerOpen((open) => !open)}
        disabled={readOnly}
        accessibilityRole="button"
        accessibilityState={{ expanded: pickerOpen }}
        style={({ pressed }) => [
          styles.trigger,
          pickerOpen && styles.triggerOpen,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.label}>Who paid</Text>
        <Text style={styles.value}>{pickerLabel}</Text>
      </Pressable>

      {pickerOpen ? (
        <View style={styles.panel}>
          {members.map((member, index) => {
            const checked = selected[member.id] ?? false;
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
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedMembers.length > 0 ? (
        <View style={styles.membersCard}>
          {selectedMembers.map((member, index) => (
            <View
              key={member.id}
              style={[styles.memberRow, index > 0 && styles.memberRowDivider]}>
              <Text style={styles.memberName}>{member.displayName}</Text>
              <View style={styles.editWrap}>
                <Text style={styles.editAffix}>₹</Text>
                <TextInput
                  style={styles.editInput}
                  editable={!readOnly}
                  value={amounts[member.id] ? String(amounts[member.id] / 100) : ''}
                  onChangeText={(text) => onAmountText(member.id, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel={`Amount paid by ${member.displayName}`}
                />
              </View>
            </View>
          ))}
          {showHint ? (
            <Text style={[styles.hint, styles.hintError]}>
              Payer amounts total {formatPaise(sum)} (must be {formatPaise(total)})
            </Text>
          ) : (
            <Text style={styles.hint}>Payer amounts must total {formatPaise(total)}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}