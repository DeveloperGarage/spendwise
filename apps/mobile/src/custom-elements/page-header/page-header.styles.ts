import {Spacing, Theme} from "@/constants/theme";
import {StyleSheet} from "react-native";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    }
  });