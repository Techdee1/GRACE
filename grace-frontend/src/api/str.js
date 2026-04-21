import { apiClient } from './client'
import { mockSTRs } from '@/utils/mockData'

export const strApi = {
  getAll: () => apiClient.get('/str').then((r) => r.data).catch(() => mockSTRs),
  getById: (id) => apiClient.get(`/str/${id}`).then((r) => r.data).catch(() => mockSTRs.find((s) => s.id === id)),
  approve: (id) => apiClient.post(`/str/${id}/approve`).then((r) => r.data),
  reject: (id, reason) => apiClient.post(`/str/${id}/reject`, { reason }).then((r) => r.data),
  update: (id, content) => apiClient.patch(`/str/${id}`, { draftContent: content }).then((r) => r.data),
}
