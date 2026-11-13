import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './date-field.styles';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type DateFieldProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}>;

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type Cell = { iso: string; day: number; inMonth: boolean };

function monthCells(year: number, month: number): Cell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const leading = (firstWeekday + 6) % 7;
  const start = new Date(year, month, 1 - leading);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const [visible, setVisible] = useState({ year: selected.year, month: selected.month });

  const cells = useMemo(
    () => monthCells(visible.year, visible.month),
    [visible.year, visible.month],
  );

  const shiftMonth = (delta: number) => {
    const next = new Date(visible.year, visible.month + delta, 1);
    setVisible({ year: next.getFullYear(), month: next.getMonth() });
  };

  const selectDay = (iso: string) => {
    const picked = parseIso(iso);
    setVisible({ year: picked.year, month: picked.month });
    onChange(iso);
    setOpen(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.trigger,
          open && styles.triggerOpen,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{formatDisplayDate(value)}</Text>
          <Text style={styles.caret}>{open ? '' : '›'}</Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.navButton}>
              <Text style={styles.navLabel}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[visible.month]} {visible.year}
            </Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.navButton}>
              <Text style={styles.navLabel}>›</Text>
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday, index) => (
              <Text key={`${weekday}-${index}`} style={styles.weekday}>
                {weekday}
              </Text>
            ))}
          </View>
          {Array.from({ length: 6 }, (_, week) => (
            <View key={week} style={styles.weekRow}>
              {cells.slice(week * 7, week * 7 + 7).map((cell) => {
                const isSelected = cell.iso === value;
                return (
                  <Pressable
                    key={cell.iso}
                    onPress={() => selectDay(cell.iso)}
                    accessibilityRole="button"
                    accessibilityLabel={formatDisplayDate(cell.iso)}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.day,
                      isSelected && styles.daySelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        !cell.inMonth && styles.dayTextMuted,
                        isSelected && styles.dayTextSelected,
                      ]}>
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
