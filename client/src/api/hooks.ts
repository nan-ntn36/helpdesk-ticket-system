import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi, commentApi, categoryApi, userApi, dashboardApi } from '@/api/endpoints';
import type { TicketFilters } from '@/api/endpoints';

// ─── Tickets ────────────────────────────────────────
export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketApi.getAll(filters).then(r => r.data),
  });
}

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketApi.getById(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      ticketApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
  });
}

export function useAssignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: number; assignedToId: number | null }) =>
      ticketApi.assign(id, assignedToId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
  });
}

export function useDeleteAllTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketApi.deleteAll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Comments ───────────────────────────────────────
export function useComments(ticketId: number) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => commentApi.getByTicket(ticketId).then(r => r.data),
    enabled: !!ticketId,
  });
}

export function useCreateComment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentApi.create(ticketId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', ticketId] });
      qc.invalidateQueries({ queryKey: ['tickets', ticketId] });
    },
  });
}

// ─── Categories ─────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then(r => r.data),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ─── Users ──────────────────────────────────────────
export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => userApi.getAll(page, limit).then(r => r.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      userApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => userApi.getRoles().then(r => r.data),
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
}

// ─── Dashboard ──────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
  });
}
