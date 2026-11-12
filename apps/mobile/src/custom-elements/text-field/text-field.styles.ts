import {Platform, StyleSheet} from 'react-native';

import { Radius, Sizes, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    input: {
      ...Typography.body,
      color: theme.text,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: Sizes.buttonHeight,
      ...Platform.select({
        web: { outlineStyle: 'none' } as any,
      }),
    },
  });
