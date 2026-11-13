import { request } from "./clients"
import { Member } from "@/domain/models/members"

export const getMembersForGroup = async (groupId: string) => {
  const body = await request<{ members: Member[] }>(`/groups/${groupId}/members`);
  return body.members;
};