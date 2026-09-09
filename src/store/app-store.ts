'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NavKey, RoleKey } from '@/lib/constants'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: RoleKey
  phone?: string | null
  avatar?: string | null
}

interface AppState {
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  logout: () => void

  currentNav: NavKey
  setNav: (n: NavKey) => void

  selectedProjectId: string | 'all'
  setSelectedProjectId: (id: string | 'all') => void

  detailProjectId: string | null
  openProject: (id: string) => void
  closeProject: () => void

  sidebarOpen: boolean
  setSidebarOpen: (b: boolean) => void

  notifOpen: boolean
  setNotifOpen: (b: boolean) => void

  searchOpen: boolean
  setSearchOpen: (b: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null, currentNav: 'dashboard' }),

      currentNav: 'dashboard',
      setNav: (n) => set({ currentNav: n, detailProjectId: null }),

      selectedProjectId: 'all',
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      detailProjectId: null,
      openProject: (id) => set({ detailProjectId: id, currentNav: 'projects' }),
      closeProject: () => set({ detailProjectId: null }),

      sidebarOpen: false,
      setSidebarOpen: (b) => set({ sidebarOpen: b }),

      notifOpen: false,
      setNotifOpen: (b) => set({ notifOpen: b }),

      searchOpen: false,
      setSearchOpen: (b) => set({ searchOpen: b }),
    }),
    {
      name: 'ayk-app-store',
      partialize: (s) => ({ user: s.user, currentNav: s.currentNav, selectedProjectId: s.selectedProjectId }) as AppState,
    }
  )
)
