export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZADOR = 'organizador',
  ARBITRO = 'arbitro',
  COMISSAO_TECNICA = 'comissao_tecnica',
  JOGADOR = 'jogador',
  TORCEDOR = 'torcedor',
}

export const ROLE_WEIGHT: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 6,
  [UserRole.ORGANIZADOR]: 5,
  [UserRole.ARBITRO]: 4,
  [UserRole.COMISSAO_TECNICA]: 3,
  [UserRole.JOGADOR]: 2,
  [UserRole.TORCEDOR]: 1,
}
