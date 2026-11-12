import { StyleSheet } from 'react-native';

import { Radius, Spacing, type Theme } from '@/constants/theme';

const AVATAR_DOT = 26;

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: AVATAR_DOT,
      height: AVATAR_DOT,
      borderRadius: Radius.full,
      borderWidth: 2,
      borderColor: theme.background,
    },
    dotOverlap: {
      marginLeft: -Spacing.sm,
    },
  });
