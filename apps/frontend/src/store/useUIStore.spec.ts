import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './useUIStore'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().setSidebarCollapsed(false)
  })

  it('toggles the sidebar', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  })

  it('sets collapsed state explicitly and persists to localStorage', () => {
    useUIStore.getState().setSidebarCollapsed(true)
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    const raw = localStorage.getItem('copa-facil-ui')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).state.sidebarCollapsed).toBe(true)
  })
})
