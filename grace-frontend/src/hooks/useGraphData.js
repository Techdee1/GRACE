import { useQueries } from '@tanstack/react-query'
import { useAlerts } from '@/hooks/useAlerts'
import { entitiesApi } from '@/api/entities'
import { normaliseEntity } from '@/hooks/useEntities'

export function useGraphData(filterEntityIds = null) {
  const { data: alerts = [] } = useAlerts()

  const allEntityIds = [...new Set(alerts.flatMap((a) => a.entityIds ?? []))]
  const targetIds = filterEntityIds
    ? allEntityIds.filter((id) => filterEntityIds.includes(id))
    : allEntityIds

  const entityQueries = useQueries({
    queries: targetIds.map((id) => ({
      queryKey: ['entity', id],
      queryFn: async () => normaliseEntity(await entitiesApi.getById(id)),
      staleTime: 60_000,
      enabled: !!id,
    })),
  })

  const entities = entityQueries.flatMap((q) => (q.data ? [q.data] : []))
  const entitySet = new Set(entities.map((e) => e.id))

  const nodes = entities.map((e) => ({
    id: e.id,
    label: e.canonicalName,
    type: e.entityType,
    risk: e.riskLevel,
  }))

  const linkSet = new Set()
  const links = []
  entities.forEach((e) => {
    ;(e.neighbors ?? []).forEach((n) => {
      const neighborId = n.entity_id ?? n.entityId
      if (!entitySet.has(neighborId)) return
      const key = [e.id, neighborId].sort().join('--')
      if (linkSet.has(key)) return
      linkSet.add(key)
      links.push({
        source: e.id,
        target: neighborId,
        value: parseFloat(n.total_amount ?? n.totalAmount ?? 50),
      })
    })
  })

  const isLoading = entityQueries.some((q) => q.isLoading)

  return { nodes, links, isLoading }
}
