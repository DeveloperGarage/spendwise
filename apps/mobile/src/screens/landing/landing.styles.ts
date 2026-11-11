import { StyleSheet } from 'react-native';

import { Sizes, Spacing, Typography, type Theme } from '@/constants/theme';

// Layout-specific values that are not shared design tokens.
const CARD_MAX_HEIGHT = 900;
const PANEL_MAX_WIDTH = 420;
const SUBTITLE_GAP = 10;

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },

    // ----- Mobile (stacked card) -----
    safeArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    card: {
      flex: 1,
      width: '100%',
      maxWidth: Sizes.contentMaxWidth,
      maxHeight: CARD_MAX_HEIGHT,
      paddingHorizontal: Spacing.xxl,
      paddingBottom: Spacing.xxl,
    },
    topSpacer: { flex: 1.9 },
    gapSpacer: { flex: 1.5 },
    bottomSpacer: { flex: 2.7 },
    title: {
      ...Typography.title,
      textAlign: 'left',
      color: theme.text,
    },
    subtitle: {
      ...Typography.body,
      marginTop: SUBTITLE_GAP,
      textAlign: 'center',
      color: theme.textSecondary,
    },

    // ----- Desktop / wide (split screen) -----
    wideRoot: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.background,
    },
    panel: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Spacing.huge,
    },
    panelContent: {
      flex: 1,
      width: '100%',
      maxWidth: PANEL_MAX_WIDTH,
    },
    panelTopSpacer: { flex: 2.6 },
    panelMidSpacer: { flex: 2.3 },
    panelBottomSpacer: { flex: 1.7 },
    panelTitle: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: 500,
      textAlign: 'center',
      color: theme.textSecondary,
    },
  });
