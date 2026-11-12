import {request} from "@/lib/api/clients";
import {Dashboard} from "@/domain/models/dashboard";

export const loadDashBoardData = async () => {
  return await request<Dashboard>('/dashboard', {
    method: 'GET',
  });
}