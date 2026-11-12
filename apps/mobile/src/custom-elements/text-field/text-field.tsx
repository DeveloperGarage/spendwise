import { ComponentRef, forwardRef, useMemo } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './text-field.styles';

export type TextFieldProps = TextInputProps;

/**
 * TextField — the standard outlined text input used across forms
 * (name, description, email, etc.). Theme-aware, forwards its ref so
 * callers can focus it programmatically, and accepts a `style` override
 * merged onto the base input style.
 */
export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function TextField({ style, placeholderTextColor, ...rest }, ref) {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor ?? theme.textSecondary}
        {...rest}
      />
    );
  },
);
