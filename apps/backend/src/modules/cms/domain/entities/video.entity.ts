import { VideoProvider } from '../enums'

export class VideoEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly provider: VideoProvider,
    public readonly embedId: string,
    public readonly embedUrl: string,
    public readonly thumbnailUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
