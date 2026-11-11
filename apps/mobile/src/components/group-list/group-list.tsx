import {Pressable, Text, View} from "react-native";
import {TextButton} from "@/components/text-button";
import {formatRupees} from "@/lib/money";
import {useTheme} from "@/hooks/use-theme";
import {useMemo, useState} from "react";
import {createStyles} from "@/components/group-list/group-list.styles";

type Group = {
  id: string;
  userId: string;
  name: string;
  members: number;
  /** Positive = you are owed; negative = you owe. In rupees. */
  balance: number;
};

const GROUPS: Group[] = [
  { id: '001', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user1' },
  { id: '002', name: 'Flat 203', members: 3, balance: -420, userId: 'user1' },
  { id: '003', name: 'Lunch Club', members: 6, balance: 90, userId: 'user1' },
  { id: '004', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user2' },
  { id: '005', name: 'Flat 203', members: 3, balance: -420, userId: 'user2' },
  { id: '006', name: 'Lunch Club', members: 6, balance: 90, userId: 'user2' },
  { id: '007', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user3' },
  { id: '008', name: 'Flat 203', members: 3, balance: -420, userId: 'user3' },
  { id: '009', name: 'Lunch Club', members: 6, balance: 90, userId: 'user3' },
  { id: '010', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user4' },
  { id: '011', name: 'Flat 203', members: 3, balance: -420, userId: 'user4' },
  { id: '012', name: 'Lunch Club', members: 6, balance: 90, userId: 'user4' },
  { id: '013', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user5' },
  { id: '014', name: 'Flat 203', members: 3, balance: -420, userId: 'user5' },
  { id: '015', name: 'Lunch Club', members: 6, balance: 90, userId: 'user5' },
  { id: '016', name: 'Goa Trip', members: 4, balance: 1560, userId: 'user5' },
  { id: '017', name: 'Flat 203', members: 3, balance: -420, userId: 'user5' },
  { id: '018', name: 'Lunch Club', members: 6, balance: 90, userId: 'user5' },

];

const getGroupList = (userId: string) =>
  GROUPS.filter((group: Group) => group.userId === userId);


type GroupListProps = { userId: string, onSeeAll: () => void };

export function GroupList ({userId, onSeeAll}: GroupListProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);


  const onOpenGroup = (_id: string) => { /* TODO: navigate to the group detail */ };


  return (
    <>
      <View style={styles.groupsHeader}>
      <Text style={styles.groupsTitle}>Your groups</Text>
      <TextButton onPress={onSeeAll} text="See all"/>
      </View>
      <View style={styles.groupList}>
        {getGroupList(userId).map((group) => {
        const owed = group.balance >= 0;
        return (
          <Pressable
            key={group.id}
            onPress={() => onOpenGroup(group.id)}
            accessibilityRole="button"
            style={({pressed}) => [styles.groupCard, pressed && styles.pressed]}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>
                {group.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMembers}>
                {group.members} people
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
    </>
  )
}