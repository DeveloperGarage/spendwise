import {Group} from "@/domain/models/groups";
import {request} from "@/lib/api/clients";

export const getGroupsForUser = (userId: string) =>
  request<Group[]>('/groups/' + userId);