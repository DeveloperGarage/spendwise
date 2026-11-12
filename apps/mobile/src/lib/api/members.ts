import { request } from "./clients"
import { Member } from "@/domain/models/members"

export const getMembersForGroup = (groupId: string) => {
  return request<Member[]>(`/groups/${groupId}/members`)
}