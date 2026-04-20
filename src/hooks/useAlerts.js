import { useQuery } from '@tanstack/react-query'
import { mockAlerts } from '@/utils/mockData'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => Promise.resolve(mockAlerts),
    staleTime: 30_000,
  })
}

export function useAlert(id) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => Promise.resolve(mockAlerts.find((a) => a.id === id) ?? null),
    enabled: !!id,
  })
}
