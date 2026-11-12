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

function relation(net: number) {
  if (net > 0) return { label: 'you lent', tone: 'amountPositive' as const };
  if (net < 0) return { label: 'you owe', tone: 'amountNegative' as const };
  return { label: 'settled', tone: 'amountSettled' as const };
}

export function ExpenseList({ expenses, onOpenExpense }: ExpenseListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (expenses.length === 0) {
    return <Text style={styles.empty}>No expenses yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense) => {
        const { label, tone } = relation(expense.net);
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
              <Text style={styles.title}>{expense.title}</Text>
              <Text style={styles.subtitle}>
                {expense.payerName} paid ₹{groupIndian(expense.amountPaid)}
              </Text>
            </View>

            <View style={styles.amountWrap}>
              <Text style={styles.relationLabel}>{label}</Text>
              <Text style={[styles.amount, styles[tone]]}>
                {formatRupees(Math.abs(expense.net))}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
