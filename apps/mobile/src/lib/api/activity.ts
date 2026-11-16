import { GroupActivity } from '@/domain/models/activity';
import { request } from '@/lib/api/clients';

export const getActivityForGroup = (
  groupId: string,
  options?: { limit?: number; cursor?: string },
) => {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.cursor) params.set('cursor', options.cursor);
  const query = params.toString();
  const path = query
    ? `/groups/${groupId}/activity?${query}`
    : `/groups/${groupId}/activity`;
  return request<GroupActivity>(path);
};