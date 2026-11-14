import { Pressable, Text, View } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { formatRupees, groupIndian } from '@/lib/money';
import { Expense } from '@/domain/models/expense';
import { createStyles } from './expense-list.styles';

type ExpenseListProps = Readonly<{
  expenses: Expense[];
  onOpenExpense?: (id: string) => void;
}>;

function relation(effect: string | undefined) {
  if (effect === 'owe') return { label: 'you owe', tone: 'amountNegative' as const };
  if (effect === 'lent') return { label: 'you lent', tone: 'amountPositive' as const };
  return { label: 'settled', tone: 'amountSettled' as const };
}

export function ExpenseList({ expenses, onOpenExpense }: ExpenseListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return <Text style={styles.empty}>No expenses yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense) => {
        const net = expense.caller?.effectAmount ?? 0;
        const { label, tone } = relation(expense.caller?.effect);
        return (
          <Pressable
            key={expense.id}
            onPress={() => onOpenExpense?.(expense.id)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>₹</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.title}>{expense.note || 'Expense'}</Text>
              <Text style={styles.subtitle}>
                {expense.payer?.displayName ?? 'Someone'} paid ₹{groupIndian(expense.amount)}
              </Text>
            </View>

            <View style={styles.amountWrap}>
              <Text style={styles.relationLabel}>{label}</Text>
              <Text style={[styles.amount, styles[tone]]}>
                {formatRupees(Math.abs(net))}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
