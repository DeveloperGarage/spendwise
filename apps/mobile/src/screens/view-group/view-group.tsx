import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Href, router, useLocalSearchParams } from 'expo-router';

import { PageHeader, SafeArea, ScreenContainer } from '@/custom-elements';
import { Button } from '@/components/button';
import { TextButton } from '@/components/text-button';
import { ExpenseList } from '@/components/expense-list';
import { BRAND_GRADIENT } from '@/components/logo-badge';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/screens/view-group/view-group.styles';
import { formatRupees } from '@/lib/money';
import { Group } from '@/domain/models/group';
import { Expense } from '@/domain/models/expense';
import { getExpensesForGroup, getGroupById } from '@/lib/api/groups';

type Tab = 'expenses' | 'balances' | 'activity';

const TABS: { key: Tab; label: string }[] = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'balances', label: 'Balances' },
  { key: 'activity', label: 'Activity' },
];

const onBack = () => router.back();

export function ViewGroupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<Tab>('expenses');

  const onAddExpense = () => router.push({ pathname: '/add-expense', params: { groupId: id } });

  useEffect(() => {
    getGroupById(id).then(setGroup).catch(console.error);
    getExpensesForGroup(id).then((data) => setExpenses(data.expenses)).catch(console.error);
  }, [id]);

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
                {formatRupees(Math.abs(balance))}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                /* TODO: open the settle-up flow */
              }}
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

          {tab === 'expenses' ? (
            <ExpenseList expenses={expenses} />
          ) : (
            <Text style={styles.placeholder}>Coming soon.</Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="+ Add expense" onPress={onAddExpense} />
        </View>
      </ScreenContainer>
    </SafeArea>
  );
}
