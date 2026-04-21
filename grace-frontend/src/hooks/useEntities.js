import { useQuery } from '@tanstack/react-query'
import { entitiesApi } from '@/api/entities'
import { deriveRiskLevel } from '@/utils/risk'

// Maps backend entity shape → what components expect
export function normaliseEntity(e) {
  const riskScore = parseFloat(e.risk_score ?? e.riskScore ?? 0)
  return {
    ...e,
    canonicalName: e.full_name ?? e.canonicalName ?? e.id,
    entityType: (e.entity_type ?? e.entityType ?? '').toUpperCase(),
    riskScore,
    riskLevel: deriveRiskLevel(riskScore),
    linkedAlerts: e.linkedAlerts ?? [],
    createdAt: e.created_at ?? e.createdAt,
    neighbors: e.neighbors ?? [],
  }
}

export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const data = await entitiesApi.getAll()
      const items = data.items ?? data
      return Array.isArray(items) ? items.map(normaliseEntity) : []
    },
    staleTime: 60_000,
  })
}

export function useEntity(id) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: async () => {
      const data = await entitiesApi.getById(id)
      return normaliseEntity(data)
    },
    enabled: !!id,
  })
}

export function useEntityRisk(id) {
  return useQuery({
    queryKey: ['entity-risk', id],
    queryFn: () => entitiesApi.getRisk(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}
