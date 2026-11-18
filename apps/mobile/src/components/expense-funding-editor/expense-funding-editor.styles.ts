import { Opacity, Radius, Sizes, Spacing, StaticColors, Typography, Theme } from '@/constants/theme';
import { Platform, StyleSheet } from 'react-native';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sectionLabel: {
      ...Typography.overline,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },
    trigger: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      marginBottom: Spacing.sm,
    },
    triggerOpen: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    label: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginBottom: Spacing.xxs,
    },
    value: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    panel: {
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: theme.border,
      borderBottomLeftRadius: Radius.lg,
      borderBottomRightRadius: Radius.lg,
      backgroundColor: theme.surface,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    membersCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    memberRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    memberToggle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    checkbox: {
      width: Sizes.checkbox,
      height: Sizes.checkbox,
      borderRadius: Radius.sm,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxCheck: {
      color: StaticColors.white,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '700',
    },
    memberName: {
      flex: 1,
      ...Typography.bodyStrong,
      color: theme.text,
    },
    editWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    editInput: {
      ...Typography.bodyStrong,
      color: theme.text,
      textAlign: 'right',
      width: 72,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      ...Platform.select({
        web: { outlineStyle: 'none' } as object,
      }),
    },
    editAffix: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    hint: {
      ...Typography.caption,
      color: theme.textSecondary,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    hintError: {
      color: theme.negative,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
  });