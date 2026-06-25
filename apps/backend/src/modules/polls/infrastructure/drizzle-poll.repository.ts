import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../database/drizzle.service'
import { PollEntity, PollOptionEntity } from '../domain/entities/poll.entity'
import { PollStatus } from '../domain/enums'
import {
  CreatePollData,
  IPollRepository,
} from '../domain/repositories/i-poll.repository'

interface PollRow {
  id: string; championship_id: string; question: string; status: string
  created_at: Date; closed_at: Date | null
}
interface OptionRow {
  id: string; poll_id: string; text: string; votes_count: number; created_at: Date
}

const toPoll = (r: PollRow) =>
  new PollEntity(r.id, r.championship_id, r.question, r.status as PollStatus, r.created_at, r.closed_at)

const toOption = (r: OptionRow) =>
  new PollOptionEntity(r.id, r.poll_id, r.text, r.votes_count, r.created_at)

@Injectable()
export class DrizzlePollRepository implements IPollRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreatePollData): Promise<{ poll: PollEntity; options: PollOptionEntity[] }> {
    const result = await this.drizzle.runInTenantContext(async (tx) => {
      const pollRows = await tx<PollRow[]>`
        INSERT INTO polls (championship_id, question) VALUES (${data.championshipId}, ${data.question}) RETURNING *
      `
      const poll = toPoll(pollRows[0])
      const optionRows: OptionRow[] = []
      for (const text of data.options) {
        const [row] = await tx<OptionRow[]>`
          INSERT INTO poll_options (poll_id, text) VALUES (${poll.id}, ${text}) RETURNING *
        `
        optionRows.push(row)
      }
      return { poll, options: optionRows.map(toOption) }
    })
    return result
  }

  async findById(id: string): Promise<PollEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<PollRow[]>`SELECT * FROM polls WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toPoll(rows[0]) : null
  }

  async findByChampionshipId(championshipId: string): Promise<PollEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<PollRow[]>`SELECT * FROM polls WHERE championship_id = ${championshipId} ORDER BY created_at DESC`,
    )
    return rows.map(toPoll)
  }

  async findOptionsByPollId(pollId: string): Promise<PollOptionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<OptionRow[]>`SELECT * FROM poll_options WHERE poll_id = ${pollId} ORDER BY created_at ASC`,
    )
    return rows.map(toOption)
  }

  async updateStatus(id: string, status: PollStatus, closedAt?: Date): Promise<PollEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<PollRow[]>`
        UPDATE polls SET status = ${status}, closed_at = ${closedAt ?? null} WHERE id = ${id} RETURNING *
      `,
    )
    return toPoll(rows[0])
  }

  async vote(pollId: string, optionId: string, userId: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      // Insert vote (UNIQUE constraint on poll_id+user_id handles duplicates)
      await tx`
        INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (${pollId}, ${optionId}, ${userId})
        ON CONFLICT (poll_id, user_id) DO NOTHING
      `
      // Recount all votes for all options in this poll
      await tx`
        UPDATE poll_options po SET
          votes_count = (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id)
        WHERE poll_id = ${pollId}
      `
    })
  }

  async getUserVote(pollId: string, userId: string): Promise<string | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<{ option_id: string }[]>`
        SELECT option_id FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${userId} LIMIT 1
      `,
    )
    return rows[0]?.option_id ?? null
  }
}
