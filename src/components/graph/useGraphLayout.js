import { useMemo } from 'react'
import { mockGraphData } from '@/utils/mockData'

// Returns stable node/link arrays safe to pass to D3 (deep cloned to avoid mutation bleed)
export function useGraphLayout(filterRisk = 'ALL', entityIds = null) {
  return useMemo(() => {
    let nodes = mockGraphData.nodes
    let links = mockGraphData.links

    if (entityIds) {
      nodes = nodes.filter((n) => entityIds.includes(n.id))
    }

    if (filterRisk !== 'ALL') {
      nodes = nodes.filter((n) => n.risk === filterRisk)
    }

    const nodeIds = new Set(nodes.map((n) => n.id))

    // Filter links using original string IDs (before D3 mutates them to objects)
    links = links.filter((l) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      return nodeIds.has(src) && nodeIds.has(tgt)
    })

    // Deep clone so D3 simulation doesn't mutate the original mock data
    return {
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        value: l.value,
      })),
    }
  }, [filterRisk, entityIds?.join(',')])
}
