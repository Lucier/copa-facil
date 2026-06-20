export interface BracketNodeData {
  roundNumber: number
  slot: number
  roundName: string
  homeTeamId: string | null
  awayTeamId: string | null
  isBye: boolean
  // Slots in the previous round that feed this match (null for first round)
  sourceSlotA: number | null
  sourceSlotB: number | null
}

export class BracketNode {
  readonly roundNumber: number
  readonly slot: number
  readonly roundName: string
  readonly homeTeamId: string | null
  readonly awayTeamId: string | null
  readonly isBye: boolean
  readonly sourceSlotA: number | null
  readonly sourceSlotB: number | null

  constructor(data: BracketNodeData) {
    this.roundNumber = data.roundNumber
    this.slot = data.slot
    this.roundName = data.roundName
    this.homeTeamId = data.homeTeamId
    this.awayTeamId = data.awayTeamId
    this.isBye = data.isBye
    this.sourceSlotA = data.sourceSlotA
    this.sourceSlotB = data.sourceSlotB
  }
}
