import {Pressable, Text} from "react-native";
import {useTheme} from "@/hooks/use-theme";
import {useMemo} from "react";
import {createStyles} from "@/components/text-button/text-button.styles";

type TextButtonProps = {
  onPress: () => void;
  text: string;
};

export function TextButton({onPress, text}: TextButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable onPress={onPress} accessibilityRole="link">
      <Text style={styles.seeAll}>{text}</Text>
    </Pressable>
  );
}
