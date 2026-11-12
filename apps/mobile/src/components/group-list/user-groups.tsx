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

type GroupListProps = { groups: Group[], onSeeAll: () => void };
export function Groups ({groups, onSeeAll}: Readonly<GroupListProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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