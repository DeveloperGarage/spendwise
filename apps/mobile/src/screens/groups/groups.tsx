import {PageHeader, SafeArea, ScreenContainer} from "@/custom-elements";
import {Pressable, Text} from "react-native";
import {createStyles} from "@/screens/groups/groups.styles";
import {useTheme} from "@/hooks/use-theme";
import {useEffect, useMemo, useState} from "react";
import Svg, {Path} from "react-native-svg";

import {router} from "expo-router";
import {GroupsList} from "@/components/group-list";
import {getGroupsForUser} from "@/lib/api/groups";
import {Groups} from "@/domain/models/group";
import {useGoBack} from "@/hooks/use-go-back";

export function GroupsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [groups, setGroups] = useState<Groups>([]);

  useEffect(() => {
    getGroupsForUser().then(setGroups).catch(console.error);
  }, []);

  const onCancel = useGoBack()
  const onAddGroup = () => {router.push('/add-group')};

  return (
    <SafeArea>
      <ScreenContainer>
        <PageHeader>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.headerTitle}>Groups</Text>
          </Pressable>
          <Pressable
            onPress={onAddGroup}
            accessibilityRole="button"
            accessibilityLabel="Create group"
            style={({pressed}) => [styles.squareButton, pressed && styles.pressed]}>
            <Svg width="15" height="15" viewBox="0 0 20 20">
              <Path d="M10 3v14M3 10h14" stroke={styles.squareButtonText.color} strokeWidth="3" strokeLinecap="round"/>
            </Svg>
          </Pressable>
        </PageHeader>
        <GroupsList groups={groups} limit={groups.length} />
      </ScreenContainer>
    </SafeArea>
  )
}