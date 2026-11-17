import { Text, View } from 'react-native';
import { useMemo } from 'react';

import { GroupSummary } from '@/domain/models/summary';
import { useTheme } from '@/hooks/use-theme';
import { formatPaise } from '@/lib/money';
import { createStyles } from './summary-list.styles';

type SummaryListProps = Readonly<{
  summary: GroupSummary | null;
  loading?: boolean;
  error?: string | null;
}>;

export function SummaryList({ summary, loading, error }: SummaryListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return <Text style={styles.loading}>Loading summary…</Text>;
  }
  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }
  if (!summary) {
    return <Text style={styles.empty}>No summary data.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total spent</Text>
        <Text style={styles.totalValue}>{formatPaise(summary.total)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By member</Text>
        {summary.members.map((member) => (
          <View key={member.id} style={styles.row}>
            <Text style={styles.rowName}>{member.displayName}</Text>
            <Text style={styles.rowAmount}>{formatPaise(member.share)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By category</Text>
        {summary.categories.length === 0 ? (
          <Text style={styles.empty}>No category spending yet.</Text>
        ) : (
          summary.categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <Text style={styles.rowName}>{category.name}</Text>
              <Text style={styles.rowAmount}>{formatPaise(category.amount)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}