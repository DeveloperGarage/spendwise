import {Text, View} from "react-native";
import {TextButton} from "@/components/text-button";
import {useTheme} from "@/hooks/use-theme";
import {useEffect, useMemo, useState} from "react";
import {createStyles} from "@/components/group-list/user-groups.styles";
import {GroupsList} from "@/components/group-list/groups-list";
import {getGroupsForUser} from "@/lib/api/groups";
import {Group} from "@/domain/models/groups";

type GroupListProps = { userId: string, onSeeAll: () => void };

export function Groups ({userId, onSeeAll}: Readonly<GroupListProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    getGroupsForUser(userId).then(setGroups).catch(console.error);
  }, [userId]);

  return (
    <>
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsTitle}>Your groups</Text>
        <TextButton onPress={onSeeAll} text="See all"/>
      </View>
      <GroupsList groups={groups } limit={4} />
    </>
  )
}