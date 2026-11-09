import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'style'> & {
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
  const isDisabled = disabled || loading;
  const isSecondary = variant === 'secondary';
  const backgroundColor = isSecondary ? theme.surface : theme.primary;
  const textColor = isSecondary ? theme.text : theme.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        isSecondary && { borderWidth: 1, borderColor: theme.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
