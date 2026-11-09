import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type TextLinkProps = {
  label: string;
  onPress?: () => void;
  /** Extra container styles, e.g. alignment or margins per screen. */
  style?: StyleProp<ViewStyle>;
};

/** A tappable inline text link rendered in the brand primary color. */
export function TextLink({ label, onPress, style }: TextLinkProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => [styles.base, style, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={[styles.label, { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.6,
  },
});
