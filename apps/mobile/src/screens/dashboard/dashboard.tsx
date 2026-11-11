import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, type Href } from 'expo-router';

import { Button } from '@/components/button';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { useMe } from '@/lib/session';
import { createStyles } from './dashboard.styles';

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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const me = useMe();
  const net = NET_OWED - NET_OWE;

  if (me.isPending) {
    return (
      <View style={styles.loading}>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{GREETING}</Text>
              <Text style={styles.name}>{me.data.displayName}</Text>
            </View>
            <View style={styles.avatar} />
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
            <Text style={styles.groupsTitle}>Your groups</Text>
            <Pressable onPress={onSeeAll} accessibilityRole="link">
              <Text style={styles.seeAll}>See all</Text>
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
                  style={({ pressed }) => [styles.groupCard, pressed && styles.pressed]}>
                  <View style={styles.groupAvatar}>
                    <Text style={styles.groupAvatarText}>
                      {group.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>
                      {group.members} people
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.groupAmount,
                      owed ? styles.groupAmountPositive : styles.groupAmountNegative,
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
