import {Radius, Sizes, Spacing, Typography, Theme, Opacity} from "@/constants/theme";
import {StyleSheet} from "react-native";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    groupsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    groupsTitle: {
      ...Typography.subheading,
      color: theme.text,
    },
    seeAll: {
      ...Typography.link,
      color: theme.primary,
    },
  });