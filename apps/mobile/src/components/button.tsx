import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  /** The button text — the "Label" configuration from the Figma component. */
  label: string;
  /** Visual style. Currently only the primary CTA used across the app. */
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses while an action is in flight. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Button / Primary — the CTA used for "Add expense", "Save expense", etc.
 * Mirrors the Figma component: full-width pill, bold label, theme-aware
 * (light + dark are driven by the active color scheme).
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: theme.primary },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.primaryText} />
      ) : (
        <Text style={[styles.label, { color: theme.primaryText }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 700,
  },
});
