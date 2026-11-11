import {useTheme} from "@/hooks/use-theme";
import {useMemo} from "react";
import {createStyles} from "@/custom-elements/screen-container/screen-container.styles";
import { View } from "react-native";

export function ScreenContainer({children}: {children: React.ReactNode}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {children}
    </View>
  )
}