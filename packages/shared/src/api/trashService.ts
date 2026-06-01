import axiosInstance from './axiosInstance';

export type TrashProject = {
  id: string;
  name: string;
  address?: string;
  category?: string;
  deleted_at: string;
};

export type TrashUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  deleted_at: string;
};

export type TrashData = {
  projects: TrashProject[];
  users: TrashUser[];
};

export const trashService = {
  async getAll(): Promise<TrashData> {
    const { data } = await axiosInstance.get<TrashData>('/trash');
    return data;
  },
  async restoreProject(id: string): Promise<void> {
    await axiosInstance.put(`/trash/projects/${id}/restore`);
  },
  async restoreUser(id: string): Promise<void> {
    await axiosInstance.put(`/trash/users/${id}/restore`);
  },
};
