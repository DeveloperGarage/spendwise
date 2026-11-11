import {Sizes, Theme} from "@/constants/theme";
import {StyleSheet} from "react-native";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      maxWidth: Sizes.contentMaxWidth,
    }
  });
