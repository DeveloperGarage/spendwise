import {Group} from "@/domain/models/group";
import {Expense} from "@/domain/models/expense";
import {request} from "@/lib/api/clients";

export const getGroupsForUser = (userId: string) =>
  request<Group[]>('/groups/' + userId);

export const getGroupById = (groupId: string) =>
  request<Group>('/groups/group/' + groupId);

export const getExpensesForGroup = (groupId: string) =>
  request<Expense[]>('/groups/group/' + groupId + '/expenses');