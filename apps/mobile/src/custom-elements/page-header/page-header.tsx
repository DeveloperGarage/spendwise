import {View} from "react-native";
import {useTheme} from "@/hooks/use-theme";
import {createStyles} from "@/custom-elements/page-header/page-header.styles";

export function PageHeader({children}: {children: React.ReactNode}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.pageHeader}>
      {children}
    </View>
  )
}

