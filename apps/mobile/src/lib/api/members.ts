import { request } from "./clients"
import { Member } from "@/domain/models/members"

export const getMembersForGroup = (groupId: string) => {
  return request<Member[]>(`/groups/group/${groupId}/members`)
}