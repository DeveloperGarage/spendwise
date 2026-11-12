import {Pressable, Text, View} from "react-native";
import {formatRupees} from "@/lib/money";
import {useTheme} from "@/hooks/use-theme";
import {useMemo} from "react";
import { createStyles } from "./gropus-list.styles";
import {Group} from "@/domain/models/group";
import {Href, router} from "expo-router";

const onOpenGroup = (id: string) => { router.push(`/view-group/${id}` as Href) };
export function GroupsList({groups, limit}: Readonly<{ groups: Group[], limit: number }>) {
  const theme = useTheme();
  const styles = useMemo(() =>
    createStyles(theme), [theme]);


  return (
    <View style={styles.groupList}>
      {groups.slice(0, limit).map((group) => {
        const owed = group.balance >= 0;
        return (
          <Pressable
            key={group.id}
            onPress={() => onOpenGroup(group.id)}
            accessibilityRole="button"
            style={({pressed}) =>
              [styles.groupCard, pressed && styles.pressed]}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>
                {group.name.charAt(0)}
              </Text>
            </View>

            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMembers}>
                {group.membersCount} people
              </Text>
            </View>

            <Text
              style={[
                styles.groupAmount,
                owed ? styles.groupAmountPositive : styles.groupAmountNegative,
              ]}>
              {owed ? '+ ' : '− '}
              {formatRupees(group.balance)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}