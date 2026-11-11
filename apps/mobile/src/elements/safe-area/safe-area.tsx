import {SafeAreaView} from "react-native-safe-area-context";
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/elements/safe-area/safe-area.styles';
import {ReactNode} from "react";

export function SafeArea({children}: {children: ReactNode}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      {children}
    </SafeAreaView>
  );
}