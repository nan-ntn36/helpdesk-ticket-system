import api from './axios';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdById: number;
  assignedToId: number | null;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; fullName: string; email: string };
  assignedTo: { id: number; fullName: string; email: string } | null;
  category: { id: number; name: string } | null;
  _count: { comments: number; attachments: number };
}

export interface TicketDetail extends Ticket {
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: { id: number; fullName: string };
  }>;
  histories: Array<{
    id: number;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: { id: number; fullName: string };
  }>;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const ticketApi = {
  getAll: (filters: TicketFilters = {}) =>
    api.get('/tickets', { params: filters }),
  getById: (id: number) =>
    api.get(`/tickets/${id}`),
  create: (data: { title: string; description: string; priority?: string; categoryId?: number }) =>
    api.post('/tickets', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/tickets/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }),
  assign: (id: number, assignedToId: number | null) =>
    api.patch(`/tickets/${id}/assign`, { assignedToId }),
  delete: (id: number) =>
    api.delete(`/tickets/${id}`),
  deleteAll: () =>
    api.delete('/tickets/all'),
};

export const commentApi = {
  getByTicket: (ticketId: number) =>
    api.get(`/tickets/${ticketId}/comments`),
  create: (ticketId: number, content: string) =>
    api.post(`/tickets/${ticketId}/comments`, { content }),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (name: string) => api.post('/categories', { name }),
};

export const userApi = {
  getAll: (page = 1, limit = 10) =>
    api.get('/users', { params: { page, limit } }),
  getById: (id: number) =>
    api.get(`/users/${id}`),
  create: (data: { fullName: string; email: string; password: string; roleId: number }) =>
    api.post('/users', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/users/${id}`, data),
  getRoles: () =>
    api.get('/users/roles'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  clearAll: () => api.delete('/notifications'),
};
