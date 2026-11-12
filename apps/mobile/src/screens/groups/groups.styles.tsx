import { StyleSheet } from 'react-native';
import {Radius, Sizes, Spacing, Theme, Typography} from "@/constants/theme";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backChevron: {
      ...Typography.heading,
      color: theme.text,
    },
    headerTextContainer: {
      gap: Spacing.xxs,
    },
    headerTitle: {
      ...Typography.subheading,
      color: theme.text,
    },
    squareButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    squareButtonText: {
      ...Typography.subheading,
      margin: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.primaryText,
    },
  })
