import { View } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './member-avatars.styles';

const MEMBER_COLORS = ['#B9A7FF', '#9AD0FF', '#FFE08A', '#FFB4C6'];

type MemberAvatarsProps = Readonly<{ count: number }>;

export function MemberAvatars({ count }: MemberAvatarsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const visible = MEMBER_COLORS.slice(0, Math.max(1, Math.min(count, MEMBER_COLORS.length)));

  return (
    <View style={styles.row}>
      {visible.map((color, index) => (
        <View
          key={color}
          style={[styles.dot, { backgroundColor: color }, index > 0 && styles.dotOverlap]}
        />
      ))}
    </View>
  );
}
