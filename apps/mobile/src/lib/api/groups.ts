import {Group, Groups, POST_GROUP} from "@/domain/models/group";
import {PostExpense} from "@/domain/models/postExpense";
import {request} from "@/lib/api/clients";

export const getGroupsForUser = async () => {
  const body = await request<{ groups: Groups }>('/groups');
  return body.groups;
};

export const getGroupById = (groupId: string) =>
  request<Group>(`/groups/${groupId}`);

export const getExpensesForGroup = (groupId: string) =>
  request<PostExpense[]>(`/groups/${groupId}/expenses`);

export const createGroup = (group: POST_GROUP) =>
  request<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  });