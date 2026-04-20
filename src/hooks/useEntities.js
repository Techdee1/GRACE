import { useQuery } from '@tanstack/react-query'
import { mockEntities } from '@/utils/mockData'

export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: () => Promise.resolve(mockEntities),
    staleTime: 30_000,
  })
}

export function useEntity(id) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => Promise.resolve(mockEntities.find((e) => e.id === id) ?? null),
    enabled: !!id,
  })
}
