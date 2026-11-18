import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { PageHeader, SafeArea, ScreenContainer } from '@/custom-elements';
import { Button } from '@/components/button';
import { TextButton } from '@/components/text-button';
import { ActivityList } from '@/components/activity-list';
import { BalanceList } from '@/components/balance-list';
import { SummaryList } from '@/components/summary-list';
import { ExpenseList } from '@/components/expense-list';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/screens/view-group/view-group.styles';
import { ActivityItem } from '@/domain/models/activity';
import { GroupBalances } from '@/domain/models/balances';
import { Group } from '@/domain/models/group';
import { Expense } from '@/domain/models/expense';
import { ApiError } from '@/lib/api/clients';
import { getActivityForGroup } from '@/lib/api/activity';
import { getSummaryForGroup } from '@/lib/api/categories';
import { GroupSummary } from '@/domain/models/summary';
import { getBalancesForGroup, getExpensesForGroup, getGroupById } from '@/lib/api/groups';
import { formatPaise } from '@/lib/money';
import { useMe } from '@/lib/session';
import { useGoBack } from '@/hooks/use-go-back';

type Tab = 'expenses' | 'balances' | 'summary' | 'activity';

const TABS: { key: Tab; label: string }[] = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'balances', label: 'Balances' },
  { key: 'summary', label: 'Summary' },
  { key: 'activity', label: 'Activity' },
];

export function ViewGroupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('expenses');
  const { data: me } = useMe();
  const onBack = useGoBack();

  const onAddExpense = () => router.push({ pathname: '/add-expense', params: { groupId: id } });

  const onOpenExpense = (expenseId: string) => {
    if (!id) return;
    router.push({ pathname: '/edit-expense', params: { groupId: id, expenseId } });
  };

  const openSettleUp = (suggestion?: GroupBalances['suggestion'][number]) => {
    if (!id) return;
    router.push({
      pathname: '/settle-up',
      params: {
        groupId: id,
        ...(suggestion
          ? {
              fromMemberId: suggestion.fromMemberId,
              toMemberId: suggestion.toMemberId,
              amountPaise: String(suggestion.amount),
            }
          : {}),
      },
    });
  };

  const refreshGroup = useCallback(() => {
    if (!id) return;
    getGroupById(id).then(setGroup).catch(console.error);
    getExpensesForGroup(id).then((data) => setExpenses(data.expenses)).catch(console.error);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refreshGroup();
    }, [refreshGroup]),
  );

  const refreshBalances = useCallback(() => {
    if (tab !== 'balances' || !id) return;
    setBalancesLoading(true);
    setBalancesError(null);
    getBalancesForGroup(id)
      .then(setBalances)
      .catch((error) => {
        setBalances(null);
        if (error instanceof ApiError && error.status === 404) {
          setBalancesError('Group not found.');
        } else {
          setBalancesError('Could not load balances.');
        }
      })
      .finally(() => setBalancesLoading(false));
  }, [tab, id]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  useFocusEffect(
    useCallback(() => {
      refreshBalances();
    }, [refreshBalances]),
  );

  const refreshSummary = useCallback(() => {
    if (tab !== 'summary' || !id) return;
    setSummaryLoading(true);
    setSummaryError(null);
    getSummaryForGroup(id)
      .then(setSummary)
      .catch((error) => {
        setSummary(null);
        if (error instanceof ApiError && error.status === 404) {
          setSummaryError('Group not found.');
        } else {
          setSummaryError('Could not load summary.');
        }
      })
      .finally(() => setSummaryLoading(false));
  }, [tab, id]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useFocusEffect(
    useCallback(() => {
      refreshSummary();
    }, [refreshSummary]),
  );

  const refreshActivity = useCallback(() => {
    if (tab !== 'activity' || !id) return;
    setActivityLoading(true);
    setActivityError(null);
    getActivityForGroup(id)
      .then((data) => setActivities(data.activities))
      .catch((error) => {
        setActivities(null);
        if (error instanceof ApiError && error.status === 404) {
          setActivityError('Group not found.');
        } else {
          setActivityError('Could not load activity.');
        }
      })
      .finally(() => setActivityLoading(false));
  }, [tab, id]);

  useEffect(() => {
    refreshActivity();
  }, [refreshActivity]);

  useFocusEffect(
    useCallback(() => {
      refreshActivity();
    }, [refreshActivity]),
  );

  const name = group?.name ?? 'Group';
  const balance = group?.balance ?? 0;
  const owed = balance >= 0;

  return (
    <SafeArea>
      <ScreenContainer>
        <PageHeader>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.headerTitle}>{name}</Text>
          </Pressable>
          <TextButton
            onPress={() => router.push({ pathname: '/add-members', params: { groupId: id } })}
            text="Add"
          />
        </PageHeader>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}>
            <View>
              <Text style={styles.bannerLabel}>{owed ? 'You are owed' : 'You owe'}</Text>
              <Text
                style={[
                  styles.bannerValue,
                  balance > 0 && styles.bannerPositive,
                  balance < 0 && styles.bannerNegative,
                ]}>
                {formatPaise(Math.abs(balance))}
              </Text>
            </View>
            <Pressable
              onPress={() => openSettleUp(balances?.suggestion[0])}
              accessibilityRole="button"
              style={({ pressed }) => [styles.settleButton, pressed && styles.pressed]}>
              <Text style={styles.settleButtonText}>Settle up</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.tabs}>
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.tab, active && styles.tabActive]}>
                  <Text style={active ? styles.tabTextActive : styles.tabText}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'expenses' && <ExpenseList expenses={expenses} onOpenExpense={onOpenExpense} />}
          {tab === 'balances' && (
            <BalanceList
              balances={balances}
              currentUserId={me?.id}
              loading={balancesLoading}
              error={balancesError}
              onSuggestionPress={(row) => openSettleUp(row)}
            />
          )}
          {tab === 'summary' && (
            <SummaryList summary={summary} loading={summaryLoading} error={summaryError} />
          )}
          {tab === 'activity' && (
            <ActivityList
              activities={activities}
              loading={activityLoading}
              error={activityError}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="+ Add expense" onPress={onAddExpense} />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
