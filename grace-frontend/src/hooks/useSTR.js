import { useQuery } from '@tanstack/react-query'
import { mockSTRs } from '@/utils/mockData'

export function useSTRs() {
  return useQuery({
    queryKey: ['strs'],
    queryFn: () => Promise.resolve(mockSTRs),
    staleTime: 30_000,
  })
}

export function useSTR(id) {
  return useQuery({
    queryKey: ['str', id],
    queryFn: () => Promise.resolve(mockSTRs.find((s) => s.id === id) ?? null),
    enabled: !!id,
  })
}
