import { GroupCategories } from '@/domain/models/category';
import { GroupSummary } from '@/domain/models/summary';
import { request } from '@/lib/api/clients';

export const getCategoriesForGroup = (groupId: string) =>
  request<GroupCategories>(`/groups/${groupId}/categories`);

export const getSummaryForGroup = (groupId: string) =>
  request<GroupSummary>(`/groups/${groupId}/summary`);