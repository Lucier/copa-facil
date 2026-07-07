import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { TournamentFormat, ChampionshipStatus } from '../../domain/enums'
import {
  IChampionshipRepository} from '../../domain/repositories/i-championship.repository'
import {
  CHAMPIONSHIP_REPOSITORY
} from '../../domain/repositories/i-championship.repository'
import {
  IRoundRepository,
  RoundInput} from '../../domain/repositories/i-round.repository'
import {
  ROUND_REPOSITORY,
} from '../../domain/repositories/i-round.repository'
import { ITeamRepository } from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { TournamentEngine } from '../../domain/services/tournament-engine'
import { GenerateFixturesInputDto } from '../dtos/generate-fixtures-input.dto'
import { BracketOutputDto } from '../dtos/bracket-output.dto'
import { FixtureMapper } from '../mappers/fixture.mapper'
import { DrizzleService } from '../../../../database/drizzle.service'

@Injectable()
export class GenerateFixturesUseCase {
  constructor(
    @Inject(CHAMPIONSHIP_REPOSITORY)
    private readonly championshipRepo: IChampionshipRepository,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepo: IRoundRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepo: ITeamRepository,
    private readonly drizzle: DrizzleService,
  ) {}

  async execute(
    championshipId: string,
    dto: GenerateFixturesInputDto,
  ): Promise<BracketOutputDto> {
    const championship = await this.championshipRepo.findById(championshipId)
    if (!championship) throw new NotFoundException('Championship not found')
    if (!championship.isDraft()) {
      throw new BadRequestException('Fixtures can only be generated for draft championships')
    }

    const teams = await this.teamRepo.findByIds(dto.teamIds)
    if (teams.length !== dto.teamIds.length) {
      throw new BadRequestException('One or more team IDs are invalid')
    }

    // Respect caller's seed order
    const orderedTeamIds = dto.teamIds

    const legs = championship.legs as 1 | 2
    let roundInputs: RoundInput[] = []
    let groupMap: Map<number, string> | undefined

    switch (championship.format) {
      case TournamentFormat.PONTOS_CORRIDOS: {
        const slots = TournamentEngine.generateRoundRobin(orderedTeamIds, legs)
        roundInputs = slots.map((s) => ({
          number: s.roundNumber,
          name: s.name,
          phase: 'knockout' as const,
          matches: s.matches.map((m) => ({
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
          })),
        }))
        break
      }

      case TournamentFormat.MATA_MATA: {
        const bracketRounds = TournamentEngine.generateEliminationBracket(
          orderedTeamIds,
          legs,
        )
        roundInputs = bracketRounds.map((br) => ({
          number: br.roundNumber,
          name: br.name,
          phase: 'knockout' as const,
          matches: br.matches.flatMap((m) => {
            // For legs=2 each bracket match becomes two fixtures (home + away)
            const base = {
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              bracketSlot: m.slot,
            }
            return legs === 2 ? [base, { ...base, homeTeamId: base.awayTeamId, awayTeamId: base.homeTeamId }] : [base]
          }),
        }))
        break
      }

      case TournamentFormat.GRUPOS_MATA_MATA: {
        const groupCount = dto.groupCount
        const qualifiersPerGroup = dto.qualifiersPerGroup
        if (!groupCount || !qualifiersPerGroup) {
          throw new BadRequestException(
            'groupCount and qualifiersPerGroup are required for grupos_mata_mata format',
          )
        }

        const result = TournamentEngine.generateGroupsAndKnockout(
          orderedTeamIds,
          groupCount,
          qualifiersPerGroup,
          legs,
        )

        // Persist groups, capture their DB IDs
        groupMap = await this.saveGroups(championshipId, result.groups)

        // Group-stage rounds
        for (const g of result.groups) {
          const gId = groupMap.get(g.orderIndex)
          const gRounds = result.groupRounds.get(g.orderIndex) ?? []
          for (const r of gRounds) {
            roundInputs.push({
              number: r.roundNumber,
              name: `Grupo ${g.name} — ${r.name}`,
              phase: 'group' as const,
              groupId: gId,
              matches: r.matches.map((m) => ({
                homeTeamId: m.homeTeamId,
                awayTeamId: m.awayTeamId,
                groupId: gId,
              })),
            })
          }
        }

        // Knockout bracket (TBD teams from group phase)
        const knockoutRounds = TournamentEngine.generateEliminationBracket(
          result.knockoutSeeds,
          legs,
        )
        for (const br of knockoutRounds) {
          roundInputs.push({
            number: (roundInputs.length > 0
              ? Math.max(...roundInputs.map((r) => r.number))
              : 0) + 1,
            name: br.name,
            phase: 'knockout' as const,
            matches: br.matches.map((m) => ({
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              bracketSlot: m.slot,
            })),
          })
        }
        break
      }
    }

    // Assign scheduledAt per round if the caller supplied scheduling params
    if (dto.startDate) {
      const [hours, minutes] = (dto.defaultTime ?? '10:00').split(':').map(Number)
      const daysBetween = dto.daysBetweenRounds ?? 7
      const uniqueRoundNumbers = [...new Set(roundInputs.map((r) => r.number))].sort((a, b) => a - b)
      const roundIndexMap = new Map(uniqueRoundNumbers.map((n, i) => [n, i]))
      for (const ri of roundInputs) {
        const roundIndex = roundIndexMap.get(ri.number) ?? 0
        const date = new Date(`${dto.startDate}T00:00:00`)
        date.setDate(date.getDate() + roundIndex * daysBetween)
        date.setHours(hours, minutes, 0, 0)
        ri.matches = ri.matches.map((m) => ({ ...m, scheduledAt: new Date(date) }))
      }
    }

    const savedRounds = await this.roundRepo.saveFixtures(
      championshipId,
      roundInputs,
      groupMap,
    )

    await this.championshipRepo.updateStatus(championshipId, ChampionshipStatus.ACTIVE)

    return FixtureMapper.toBracketOutputDto(championshipId, championship.format, savedRounds)
  }

  // Inserts groups into DB via raw tenant SQL, returns orderIndex→id map
  private async saveGroups(
    championshipId: string,
    groups: Array<{ name: string; orderIndex: number; teamIds: string[] }>,
  ): Promise<Map<number, string>> {
    type GroupRow = { id: string; order_index: number }
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      const inserted: GroupRow[] = []
      for (const g of groups) {
        const [row] = await tx<GroupRow[]>`
          INSERT INTO groups (championship_id, name, order_index)
          VALUES (${championshipId}, ${g.name}, ${g.orderIndex})
          RETURNING id, order_index
        `
        for (const teamId of g.teamIds) {
          await tx`
            INSERT INTO group_teams (group_id, team_id)
            VALUES (${row.id}, ${teamId})
          `
        }
        inserted.push(row)
      }
      return inserted
    })
    return new Map(rows.map((r) => [r.order_index, r.id]))
  }
}
