import { describe, it, expect, vi } from 'vitest'
import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TenantRolesGuard } from '../presentation/guards/tenant-roles.guard'
import { UserRole } from '../domain/roles.enum'
import { ROLES_KEY } from '../presentation/decorators/roles.decorator'
import type { ExecutionContext } from '@nestjs/common'

function makeContext(role: string | undefined, requiredRoles: UserRole[] | undefined): ExecutionContext {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(requiredRoles) } as unknown as Reflector
  const request = { user: role ? { role } : {} }
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext
}

describe('TenantRolesGuard', () => {
  it('allows when no roles are required (public-authed route)', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) } as unknown as Reflector
    const guard = new TenantRolesGuard(reflector)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({}) }) } as unknown as ExecutionContext
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('allows ORGANIZADOR to access ORGANIZADOR route', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ORGANIZADOR]) } as unknown as Reflector
    const guard = new TenantRolesGuard(reflector)
    const ctx = makeContext(UserRole.ORGANIZADOR, [UserRole.ORGANIZADOR])
    ;(ctx as any).switchToHttp = () => ({ getRequest: () => ({ user: { role: UserRole.ORGANIZADOR } }) })
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ORGANIZADOR]) }
    const g = new TenantRolesGuard(r as unknown as Reflector)
    expect(g.canActivate(ctx)).toBe(true)
  })

  it('allows SUPER_ADMIN to access any role route (highest weight)', () => {
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ORGANIZADOR]) } as unknown as Reflector
    const guard = new TenantRolesGuard(r)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.SUPER_ADMIN } }) }) } as unknown as ExecutionContext
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('throws ForbiddenException when JOGADOR tries ORGANIZADOR route', () => {
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ORGANIZADOR]) } as unknown as Reflector
    const guard = new TenantRolesGuard(r)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.JOGADOR } }) }) } as unknown as ExecutionContext
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when ARBITRO tries ORGANIZADOR route', () => {
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ORGANIZADOR]) } as unknown as Reflector
    const guard = new TenantRolesGuard(r)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ARBITRO } }) }) } as unknown as ExecutionContext
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when user has no role in tenant context', () => {
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ARBITRO]) } as unknown as Reflector
    const guard = new TenantRolesGuard(r)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({ user: {} }) }) } as unknown as ExecutionContext
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it('allows ARBITRO to access ARBITRO route', () => {
    const r = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.ARBITRO]) } as unknown as Reflector
    const guard = new TenantRolesGuard(r)
    const ctx = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ARBITRO } }) }) } as unknown as ExecutionContext
    expect(guard.canActivate(ctx)).toBe(true)
  })
})
