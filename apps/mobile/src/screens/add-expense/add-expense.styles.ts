import {Platform, StyleSheet} from 'react-native';

import {
  Opacity,
  Radius,
  Sizes,
  Spacing,
  StaticColors,
  Typography,
  type Theme,
} from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ----- Header -----
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backChevron: {
      ...Typography.heading,
      color: theme.text,
    },
    headerTitle: {
      ...Typography.subheading,
      color: theme.text,
    },

    // ----- Amount card -----
    amountCard: {
      backgroundColor: theme.accentSurface,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    amountLabel: {
      ...Typography.overline,
      color: theme.primary,
      textAlign: 'center',
    },
    amountInput: {
      ...Typography.display,
      color: theme.text,
      textAlign: 'center',
      marginTop: Spacing.sm,
      paddingVertical: 0,
      minWidth: 160,
      ...Platform.select({
        web: { outlineStyle: 'none' } as any,
      }),
    },

    // ----- Generic field block -----
    fieldBlock: {
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.overline,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },

    // ----- Row field (Paid by / Group) -----
    rowField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: Sizes.buttonHeight,
    },
    rowFieldLabel: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    rowFieldValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    rowFieldValue: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    chevronRight: {
      ...Typography.bodyStrong,
      color: theme.textSecondary,
    },

    // ----- Split segmented control -----
    segmentGroup: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundElement,
      borderRadius: Radius.lg,
      padding: Spacing.xxs,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
    },
    segmentActive: {
      backgroundColor: theme.surface,
    },
    segmentText: {
      ...Typography.bodyStrong,
      color: theme.textSecondary,
    },
    segmentTextActive: {
      color: theme.primary,
    },

    // ----- Members -----
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
      fontWeight: 700,
    },
    memberName: {
      flex: 1,
      ...Typography.bodyStrong,
      color: theme.text,
    },
    memberAmount: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    memberAmountZero: {
      color: theme.textSecondary,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
  });
