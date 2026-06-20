export class GalleryEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
