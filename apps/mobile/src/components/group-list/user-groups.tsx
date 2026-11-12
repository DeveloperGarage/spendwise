import {Text, View} from "react-native";
import {TextButton} from "@/components/text-button";
import {useTheme} from "@/hooks/use-theme";
import {useEffect, useMemo, useState} from "react";
import {createStyles} from "@/components/group-list/user-groups.styles";
import {GroupsList} from "@/components/group-list/groups-list";
import {getGroupsForUser} from "@/lib/api/groups";
import {Group} from "@/domain/models/group";
import {Member} from "@/domain/models/members";
import {getMembersForGroup} from "@/lib/api/members";

type GroupListProps = { userId: string, onSeeAll: () => void };

const enrichMembersCount = (groups: Group[]) => {
  return groups.map((group) => {
    getMembersForGroup(group.id).then((members) => {
      group.membersCount = members.length;
    }).catch(console.error);
    return group;
  });
}
export function Groups ({userId, onSeeAll}: Readonly<GroupListProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memebers, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    getGroupsForUser(userId).then(enrichMembersCount).then(setGroups).catch(console.error);
    // getMembersForGroup('someId').then().then(console.log).catch(console.error);
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