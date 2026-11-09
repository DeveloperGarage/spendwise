import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href } from 'expo-router';

import { Button } from '@/components/button';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { useMe } from '@/lib/session';

/** Groups the balance digits using the Indian numbering system (e.g. 12,34,567). */
function groupIndian(value: number): string {
  const digits = Math.abs(Math.trunc(value)).toString();
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

/** Formats a rupee amount as "₹ 1,560" (sign handled separately by the caller). */
function formatRupees(value: number): string {
  return `₹ ${groupIndian(value)}`;
}

type Group = {
  id: string;
  name: string;
  members: number;
  /** Positive = you are owed; negative = you owe. In rupees. */
  balance: number;
};

const GREETING = 'Good evening';
const NET_OWED = 2210;
const NET_OWE = 650;

const GROUPS: Group[] = [
  { id: 'goa', name: 'Goa Trip', members: 4, balance: 1560 },
  { id: 'flat', name: 'Flat 203', members: 3, balance: -420 },
  { id: 'lunch', name: 'Lunch Club', members: 6, balance: 90 },
];

export default function DashboardScreen() {
  const theme = useTheme();
  const me = useMe();
  const net = NET_OWED - NET_OWE;

  if (me.isPending) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (!me.data) {
    return <Redirect href="/" />;
  }
  if (!me.data.profileCompleted) {
    return <Redirect href={'/profile' as Href} />;
  }

  const onAddExpense = () => { /* TODO: open the add-expense flow */ };
  const onSeeAll = () => { /* TODO: navigate to the full groups list */ };
  const onOpenGroup = (_id: string) => { /* TODO: navigate to the group detail */ };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>{GREETING}</Text>
              <Text style={[styles.name, { color: theme.text }]}>{me.data.displayName}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: theme.avatarSurface }]} />
          </View>

          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>NET BALANCE</Text>
            <Text style={styles.balanceValue}>
              {net >= 0 ? '+ ' : '− '}
              {formatRupees(net)}
            </Text>
            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceColumn}>
                <Text style={styles.balanceColumnLabel}>You are owed</Text>
                <Text style={styles.balanceColumnValue}>{formatRupees(NET_OWED)}</Text>
              </View>
              <View style={styles.balanceColumn}>
                <Text style={styles.balanceColumnLabel}>You owe</Text>
                <Text style={styles.balanceColumnValue}>{formatRupees(NET_OWE)}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.groupsHeader}>
            <Text style={[styles.groupsTitle, { color: theme.text }]}>Your groups</Text>
            <Pressable onPress={onSeeAll} accessibilityRole="link">
              <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.groupList}>
            {GROUPS.map((group) => {
              const owed = group.balance >= 0;
              return (
                <Pressable
                  key={group.id}
                  onPress={() => onOpenGroup(group.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.groupCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.groupAvatar, { backgroundColor: theme.avatarSurface }]}>
                    <Text style={[styles.groupAvatarText, { color: theme.textSecondary }]}>
                      {group.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
                    <Text style={[styles.groupMembers, { color: theme.textSecondary }]}>
                      {group.members} people
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.groupAmount,
                      { color: owed ? theme.positive : theme.negative },
                    ]}>
                    {owed ? '+ ' : '− '}
                    {formatRupees(group.balance)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="+ Add expense" onPress={onAddExpense} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  // ----- Header -----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    gap: 2,
  },
  greeting: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // ----- Net balance card -----
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    letterSpacing: 0.8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: 700,
    marginTop: 8,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 16,
  },
  balanceColumn: {
    gap: 4,
  },
  balanceColumnLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 500,
  },
  balanceColumnValue: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
  },

  // ----- Groups -----
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupsTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 700,
  },
  seeAll: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  groupList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: 16,
    fontWeight: 700,
  },
  groupInfo: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
  },
  groupMembers: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  groupAmount: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },

  // ----- Footer -----
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
