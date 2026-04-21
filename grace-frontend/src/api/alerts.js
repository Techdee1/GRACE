import { apiClient } from './client'
import { mockAlerts } from '@/utils/mockData'

export const alertsApi = {
  getAll: () => apiClient.get('/alerts').then((r) => r.data).catch(() => mockAlerts),
  getById: (id) => apiClient.get(`/alerts/${id}`).then((r) => r.data).catch(() => mockAlerts.find((a) => a.id === id)),
  updateStatus: (id, status) => apiClient.patch(`/alerts/${id}`, { status }).then((r) => r.data),
  addNote: (id, note) => apiClient.post(`/alerts/${id}/notes`, { note }).then((r) => r.data),
}
