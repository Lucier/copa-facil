export const TEAM_REPOSITORY = 'ITeamRepository'

export interface TeamRecord {
  id: string
  name: string
  seed: number | null
}

export interface ITeamRepository {
  findByIds(ids: string[]): Promise<TeamRecord[]>
}
