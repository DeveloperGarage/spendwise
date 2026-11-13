import { Pressable, Text, View } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/money';
import { Expense } from '@/domain/models/expense';
import { createStyles } from './expense-list.styles';

type ExpenseListProps = Readonly<{
  expenses: Expense[];
  onOpenExpense?: (index: number) => void;
}>;

export function ExpenseList({ expenses, onOpenExpense }: ExpenseListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return <Text style={styles.empty}>No expenses yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense, index) => {
        const splitWays = expense.split?.memberIds?.length ?? 0;
        return (
          <Pressable
            key={`${expense.occurredOn}-${index}`}
            onPress={() => onOpenExpense?.(index)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>₹</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.title}>{expense.note || 'Expense'}</Text>
              {splitWays > 0 ? (
                <Text style={styles.subtitle}>
                  Split {splitWays} {splitWays === 1 ? 'way' : 'ways'}
                </Text>
              ) : null}
            </View>

            <View style={styles.amountWrap}>
              <Text style={styles.relationLabel}>total</Text>
              <Text style={[styles.amount, styles.amountSettled]}>
                {formatRupees(expense.amount)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
