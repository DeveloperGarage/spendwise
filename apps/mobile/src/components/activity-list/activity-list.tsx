import { Text, View } from 'react-native';
import { useMemo } from 'react';

import { ActivityItem } from '@/domain/models/activity';
import { useTheme } from '@/hooks/use-theme';
import { describeActivityLine, formatActivityAt } from '@/lib/activity-line';
import { createStyles } from './activity-list.styles';

type ActivityListProps = Readonly<{
  activities: ActivityItem[] | null;
  loading?: boolean;
  error?: string | null;
}>;

export function ActivityList({ activities, loading, error }: ActivityListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return <Text style={styles.loading}>Loading activity…</Text>;
  }
  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }
  if (!activities || activities.length === 0) {
    return <Text style={styles.empty}>No activity yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {activities.map((item) => {
        const { title } = describeActivityLine(item);
        const voided = item.action === 'voided';
        return (
          <View key={item.id} style={[styles.card, voided && styles.cardVoided]}>
            <Text style={[styles.title, voided && styles.titleVoided]}>{title}</Text>
            <Text style={styles.at}>{formatActivityAt(item.at)}</Text>
          </View>
        );
      })}
    </View>
  );
}