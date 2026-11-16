import { Pressable, Text, View } from 'react-native';
import { useMemo } from 'react';

import { GroupBalances } from '@/domain/models/balances';
import { useTheme } from '@/hooks/use-theme';
import { formatPaise } from '@/lib/money';
import { createStyles } from './balance-list.styles';

type BalanceListProps = Readonly<{
  balances: GroupBalances | null;
  currentUserId?: string;
  loading?: boolean;
  error?: string | null;
  onSuggestionPress?: (suggestion: GroupBalances['suggestion'][number]) => void;
}>;

function statusLabel(balance: number) {
  if (balance > 0) return 'is owed';
  if (balance < 0) return 'owes';
  return 'settled';
}

function amountTone(balance: number) {
  if (balance > 0) return 'amountPositive' as const;
  if (balance < 0) return 'amountNegative' as const;
  return 'amountSettled' as const;
}

export function BalanceList({
  balances,
  currentUserId,
  loading,
  error,
  onSuggestionPress,
}: BalanceListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return <Text style={styles.loading}>Loading balances…</Text>;
  }
  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }
  if (!balances) {
    return <Text style={styles.empty}>No balance data.</Text>;
  }

  const nameById = new Map(
    balances.members.map((member) => [member.id, member.displayName]),
  );
  const allSettled = balances.members.every((member) => member.balance === 0);

  if (allSettled && balances.suggestion.length === 0) {
    return <Text style={styles.empty}>Everyone is settled up.</Text>;
  }

  return (
    <View style={styles.section}>
      <View style={styles.list}>
        {balances.members.map((member) => {
          const isYou = currentUserId === member.id;
          const tone = amountTone(member.balance);
          return (
            <View key={member.id} style={styles.card}>
              <View style={styles.nameBlock}>
                <Text style={styles.name}>
                  {member.displayName}
                  {isYou ? ' (you)' : ''}
                </Text>
                <Text style={styles.status}>{statusLabel(member.balance)}</Text>
              </View>
              <Text style={[styles.amount, styles[tone]]}>
                {formatPaise(member.balance)}
              </Text>
            </View>
          );
        })}
      </View>

      {balances.suggestion.length > 0 && (
        <>
          <Text style={styles.suggestionHeading}>Suggested payments</Text>
          <View style={styles.suggestionList}>
            {balances.suggestion.map((row, index) => {
              const from = nameById.get(row.fromMemberId) ?? 'Someone';
              const to = nameById.get(row.toMemberId) ?? 'Someone';
              const content = (
                <Text style={styles.suggestionRow}>
                  {from} pays {to} {formatPaise(row.amount)}
                </Text>
              );
              if (!onSuggestionPress) {
                return <View key={`${row.fromMemberId}-${row.toMemberId}-${index}`}>{content}</View>;
              }
              return (
                <Pressable
                  key={`${row.fromMemberId}-${row.toMemberId}-${index}`}
                  onPress={() => onSuggestionPress(row)}
                  accessibilityRole="button"
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  {content}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}