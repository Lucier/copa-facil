import { RoundWithMatches } from '../../domain/repositories/i-round.repository'
import { BracketOutputDto, MatchOutputDto, RoundOutputDto } from '../dtos/bracket-output.dto'

export class FixtureMapper {
  static toRoundOutputDto(rw: RoundWithMatches): RoundOutputDto {
    const dto = new RoundOutputDto()
    dto.id = rw.round.id
    dto.number = rw.round.number
    dto.name = rw.round.name
    dto.phase = rw.round.phase
    dto.groupId = rw.round.groupId
    dto.matches = rw.matches.map((m) => {
      const match = new MatchOutputDto()
      match.id = m.id
      match.roundId = m.roundId
      match.homeTeamId = m.homeTeamId
      match.awayTeamId = m.awayTeamId
      match.bracketSlot = m.bracketSlot
      match.isBye = m.isBye()
      match.status = m.status
      return match
    })
    return dto
  }

  static toBracketOutputDto(
    championshipId: string,
    format: string,
    rounds: RoundWithMatches[],
  ): BracketOutputDto {
    const dto = new BracketOutputDto()
    dto.championshipId = championshipId
    dto.format = format
    dto.rounds = rounds.map(FixtureMapper.toRoundOutputDto)
    return dto
  }
}
