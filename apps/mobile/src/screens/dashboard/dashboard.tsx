import { LinearGradient } from 'expo-linear-gradient';
import {useEffect, useMemo, useState} from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter, type Href } from 'expo-router';

import { Button } from '@/components/button';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/money';
import { useMe } from '@/lib/session';
import { createStyles } from './dashboard.styles';
import {Groups} from "@/components/group-list";
import {SafeArea, PageHeader, ScreenContainer} from "@/custom-elements";
import {loadDashBoardData} from "@/lib/api/dashboard";
import {Dashboard} from "@/domain/models/dashboard";

export function DashboardScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const me = useMe();
  const router = useRouter();

  const onAddExpense = () => router.push('/add-expense' as Href);
  const onAddGroup = () => router.push('/add-group' as Href);
  const onSeeAll = () => { router.push('/groups' as Href) };

  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    loadDashBoardData().then((data) => {
      setDashboardData(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const net = dashboardData?.summary.net ?? 0;

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

  const actionButton = ()  =>
    dashboardData?.groups.length === 0 ?
      <Button label={"Create Group"} onPress={onAddGroup} />:
      <Button label="+ Add expense" onPress={onAddExpense} /> ;
  return (
    <SafeArea>
      <ScreenContainer>
        <ScrollView
          showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.primary}/>
            </View>
          )}
          <PageHeader>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name}>{dashboardData?.user.displayName}</Text>
            </View>
            <View style={styles.avatar}/>
          </PageHeader>

          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>NET BALANCE</Text>
            <Text style={styles.balanceValue}>
              {net >= 0 ? '+ ' : '− '}
              {formatRupees(net)}
            </Text>
            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceColumn}>
                <Text style={styles.balanceColumnLabel}>You are owed</Text>
                <Text style={styles.balanceColumnValue}>{formatRupees(dashboardData?.summary.owed ?? 0)}</Text>
              </View>
              <View style={styles.balanceColumn}>
                <Text style={styles.balanceColumnLabel}>You owe</Text>
                <Text style={styles.balanceColumnValue}>{formatRupees(dashboardData?.summary.owe ?? 0)}</Text>
              </View>
            </View>
          </LinearGradient>

          <Groups groups={dashboardData?.groups ?? []} onSeeAll={onSeeAll}/>
        </ScrollView>

        <View>
          {actionButton()}
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
