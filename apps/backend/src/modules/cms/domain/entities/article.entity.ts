import { ArticleStatus } from '../enums'

export class ArticleEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string | null,
    public readonly title: string,
    public readonly slug: string,
    public readonly content: string,
    public readonly status: ArticleStatus,
    public readonly category: string | null,
    public readonly coverImageUrl: string | null,
    public readonly authorId: string,
    public readonly publishedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
