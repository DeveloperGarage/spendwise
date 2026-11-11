
import { StyleSheet } from 'react-native';
import {Typography, Theme} from "@/constants/theme";

export const createStyles = (theme: Theme) =>
 StyleSheet.create({
    seeAll: {
      ...Typography.link,
      color: theme.primary,
    }
  }
 )