import {PageHeader, ScreenContainer, SafeArea} from "@/custom-elements";
import {Pressable, Text} from "react-native";
import {createStyles} from "@/screens/groups/groups.styles";
import {useTheme} from "@/hooks/use-theme";
import {useEffect, useMemo, useState} from "react";
import Svg, {Path} from "react-native-svg";

import {router} from "expo-router";
import {GroupsList} from "@/components/group-list";
import {getGroupsForUser} from "@/lib/api/groups";
import {Group} from "@/domain/models/group";

export function GroupsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    getGroupsForUser("mock-user-1").then(setGroups).catch(console.error);
  }, []);

  const onCancel = () => {router.back()};
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