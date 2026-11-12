import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './dropdown.styles';

export type DropdownOption = { id: string; label: string };

type DropdownProps = Readonly<{
  label: string;
  options: DropdownOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
}>;

export function Dropdown({
  label,
  options,
  selectedId,
  onSelect,
  placeholder = 'Select',
  emptyText = 'No options available',
}: DropdownProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.id === selectedId);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.trigger,
          open && styles.triggerOpen,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          <Text style={selected ? styles.value : styles.placeholder}>
            {selected ? selected.label : placeholder}
          </Text>
          <Text style={styles.caret}>{open ? '' : "›"}</Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          {options.length === 0 ? (
            <Text style={styles.empty}>{emptyText}</Text>
          ) : (
            options.map((option, index) => {
              const isSelected = option.id === selectedId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && styles.optionDivider,
                    isSelected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {isSelected ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}
