import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './button.styles';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'style'> & {
  /** The button text — the "Label" configuration from the Figma component. */
  label: string;
  /** Visual style. `primary` is the brand CTA; `secondary` is an outlined surface button (e.g. OAuth). */
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses while an action is in flight. */
  loading?: boolean;
  /** Optional leading element rendered before the label (e.g. a provider icon). */
  icon?: ReactNode;
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
  icon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;
  const isSecondary = variant === 'secondary';
  const labelStyle = isSecondary ? styles.labelSecondary : styles.labelPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelStyle.color} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, labelStyle]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
