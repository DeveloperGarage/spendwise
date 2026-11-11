import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter, type Href } from 'expo-router';

import { Button } from '@/components/button';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/money';
import { useMe } from '@/lib/session';
import { createStyles } from './dashboard.styles';
import {GroupList} from "@/components/group-list";
import {SafeArea} from "@/elements/safe-area";



const GREETING = 'Good evening';
const NET_OWED = 2210;
const NET_OWE = 650;


export function DashboardScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const me = useMe();
  const router = useRouter();
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

  const onAddExpense = () => router.push('/add-expense' as Href);
  const onSeeAll = () => { /* TODO: navigate to the full groups list */ };

  return (
    <SafeArea>
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

          <GroupList userId={'user5'} onSeeAll={onSeeAll} />
        </ScrollView>

        <View style={styles.footer}>
          <Button label="+ Add expense" onPress={onAddExpense} />
        </View>
      </View>
    </SafeArea>
  );
}
