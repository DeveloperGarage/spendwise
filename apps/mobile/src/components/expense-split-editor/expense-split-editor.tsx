import React, {useEffect, useMemo, useRef, useState} from "react";
import {Pressable, Text, TextInput, View} from "react-native";

import {useTheme} from "@/hooks/use-theme";
import {formatPaise} from "@/lib/money";
import {splitByWeights, splitEqually} from "@/lib/split";
import {percentTotal, splitInputsValid} from "@/lib/split-validation";
import {Member} from "@/domain/models/members";
import {SplitMode, SplitValue} from "@/domain/models/expense";
import {createStyles} from "./expense-split-editor.styles";

type ExpenseSplitEditorProps = {
  /** The roster the expense can be split across (group members, or just you). */
  members: Member[];
  /** The expense total, in the same integer unit as the shares it emits. */
  total: number;
  /** Emits the resolved split (chosen mode + per-participant amounts). */
  onChange: (value: SplitValue) => void;
};

const SPLIT_MODES: { key: SplitMode; label: string }[] = [
  {key: 'equal', label: 'Equally'},
  {key: 'exact', label: 'Exact'},
  {key: 'shares', label: 'Shares'},
  {key: 'percentage', label: '%'},
];

/**
 * ExpenseSplitEditor — a self-contained "split field". It owns everything about
 * *how* an expense is distributed (mode, who participates, and each
 * participant's input) and publishes only the resolved result upward via
 * `onChange`. The parent supplies the roster + total and stores the result.
 */
export function ExpenseSplitEditor({members, total, onChange}: ExpenseSplitEditorProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<SplitMode>('equal');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exactInput, setExactInput] = useState<Record<string, number>>({});
  const [sharesInput, setSharesInput] = useState<Record<string, number>>({});
  const [percentInput, setPercentInput] = useState<Record<string, number>>({});
  const [percentTouched, setPercentTouched] = useState(false);

  const isSelected = (memberId: string) => selected[memberId] ?? true;

  // Resolved split: participants + their integer shares. Derived, never stored.
  const value = useMemo<SplitValue>(() => {
    const participants = members.filter((member) => isSelected(member.id));
    const participantIds = participants.map((member) => member.id);

    let amounts: number[];
    if (mode === 'exact') {
      amounts = participants.map((member) => exactInput[member.id] ?? 0);
    } else if (mode === 'percentage') {
      amounts = splitByWeights(total, participants.map((member) => percentInput[member.id] ?? 0));
    } else if (mode === 'shares') {
      amounts = splitByWeights(total, participants.map((member) => sharesInput[member.id] ?? 0));
    } else {
      amounts = splitEqually(total, participants.length);
    }

    return {
      splitMode: mode,
      split: participants.map((member, index) => ({
        memberId: member.id,
        amount: amounts[index] ?? 0,
      })),
      inputsValid: splitInputsValid(mode, participantIds, percentInput, sharesInput),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, selected, mode, total, exactInput, percentInput, sharesInput]);

  // Publish the resolved value upward whenever it actually changes. Kept in a
  // ref so a non-memoised `onChange` can't retrigger the effect.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current(value);
  }, [value]);

  const shareById = useMemo(() => {
    const map: Record<string, number> = {};
    value.split.forEach((line) => {
      map[line.memberId] = line.amount;
    });
    return map;
  }, [value]);

  const participantIds = useMemo(
    () => members.filter((member) => isSelected(member.id)).map((member) => member.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, selected],
  );

  const percentSum = useMemo(
    () => percentTotal(participantIds, percentInput),
    [participantIds, percentInput],
  );

  const toggleMember = (memberId: string) => {
    setSelected((prev) => ({...prev, [memberId]: !(prev[memberId] ?? true)}));
  };

  const setMemberInput = (
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    memberId: string,
    text: string,
    scale = 1,
  ) => {
    const digits = text.replace(/[^0-9]/g, '');
    setter((prev) => ({...prev, [memberId]: digits ? Number(digits) * scale : 0}));
  };

  const renderShareControl = (member: Member) => {
    if (!isSelected(member.id)) {
      return <Text style={[styles.memberAmount, styles.memberAmountZero]}>{formatPaise(0)}</Text>;
    }

    if (mode === 'exact') {
      return (
        <View style={styles.editWrap}>
          <Text style={styles.editAffix}>₹</Text>
          <TextInput
            style={styles.editInput}
            value={exactInput[member.id] ? String(exactInput[member.id] / 100) : ''}
            onChangeText={(text) => setMemberInput(setExactInput, member.id, text, 100)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={`Exact amount for ${member.displayName}`}
          />
        </View>
      );
    }

    if (mode === 'shares') {
      return (
        <View style={styles.editWrap}>
          <TextInput
            style={styles.editInput}
            value={sharesInput[member.id] ? String(sharesInput[member.id]) : ''}
            onChangeText={(text) => setMemberInput(setSharesInput, member.id, text)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={`Share count for ${member.displayName}`}
          />
          <Text style={styles.editAffix}>shares</Text>
          <Text style={styles.resolvedShare}>{formatPaise(shareById[member.id] ?? 0)}</Text>
        </View>
      );
    }

    if (mode === 'percentage') {
      return (
        <View style={styles.editWrap}>
          <TextInput
            style={styles.editInput}
            value={percentInput[member.id] ? String(percentInput[member.id]) : ''}
            onChangeText={(text) => {
              setPercentTouched(true);
              setMemberInput(setPercentInput, member.id, text);
            }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={`Percentage for ${member.displayName}`}
          />
          <Text style={styles.editAffix}>%</Text>
          <Text style={styles.resolvedShare}>{formatPaise(shareById[member.id] ?? 0)}</Text>
        </View>
      );
    }

    const share = shareById[member.id] ?? 0;
    return (
      <Text style={[styles.memberAmount, share === 0 && styles.memberAmountZero]}>
        {formatPaise(share)}
      </Text>
    );
  };

  const percentHintInvalid = mode === 'percentage' && percentTouched && percentSum !== 100;

  return (
    <View>
      <Text style={styles.sectionLabel}>SPLIT</Text>
      <View style={styles.segmentGroup}>
        {SPLIT_MODES.map((item) => {
          const active = mode === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setMode(item.key)}
              accessibilityRole="button"
              accessibilityState={{selected: active}}
              style={[styles.segment, active && styles.segmentActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.membersCard}>
        {members.map((member, index) => {
          const checked = isSelected(member.id);
          return (
            <View
              key={member.id}
              style={[styles.memberRow, index > 0 && styles.memberRowDivider]}>
              <Pressable
                onPress={() => toggleMember(member.id)}
                accessibilityRole="checkbox"
                accessibilityState={{checked}}
                style={({pressed}) => [styles.memberToggle, pressed && styles.pressed]}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                </View>
                <Text style={styles.memberName}>{member.displayName}</Text>
              </Pressable>
              {renderShareControl(member)}
            </View>
          );
        })}
        {mode === 'percentage' ? (
          <Text
            style={[
              styles.totalsHint,
              percentHintInvalid && styles.totalsHintError,
            ]}>
            Total: {percentSum}% (must be 100%)
          </Text>
        ) : null}
      </View>
    </View>
  );
}