import { apiClient } from './client'
import { mockEntities } from '@/utils/mockData'

export const entitiesApi = {
  getAll: () => apiClient.get('/entities').then((r) => r.data).catch(() => mockEntities),
  getById: (id) => apiClient.get(`/entities/${id}`).then((r) => r.data).catch(() => mockEntities.find((e) => e.id === id)),
  search: (query) => apiClient.get(`/entities/search?q=${query}`).then((r) => r.data).catch(() => mockEntities.filter((e) => e.canonicalName.toLowerCase().includes(query.toLowerCase()))),
}
