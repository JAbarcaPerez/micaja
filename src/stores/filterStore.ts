import { create } from 'zustand'
import type { FilterState } from '@/types'

interface FilterStore extends FilterState {
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  clearFilters: () => void
}

const initialFilters: FilterState = {}

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialFilters,
  setFilter: (key, value) => set({ [key]: value }),
  clearFilters: () => set(initialFilters),
}))
