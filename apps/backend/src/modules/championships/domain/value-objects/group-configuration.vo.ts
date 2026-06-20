export interface GroupSlot {
  name: string         // 'A', 'B', 'C'...
  orderIndex: number
  teamIds: string[]
}

export class GroupConfiguration {
  readonly groups: ReadonlyArray<GroupSlot>
  readonly qualifiersPerGroup: number

  constructor(groups: GroupSlot[], qualifiersPerGroup: number) {
    if (groups.length < 2) {
      throw new Error('At least 2 groups are required')
    }
    if (qualifiersPerGroup < 1) {
      throw new Error('qualifiersPerGroup must be >= 1')
    }
    this.groups = Object.freeze([...groups])
    this.qualifiersPerGroup = qualifiersPerGroup
  }

  get totalQualifiers(): number {
    return this.groups.length * this.qualifiersPerGroup
  }
}
