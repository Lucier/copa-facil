export class MediaAssetEntity {
  constructor(
    public readonly id: string,
    public readonly galleryId: string,
    public readonly url: string,
    public readonly description: string | null,
    public readonly order: number,
    public readonly createdAt: Date,
  ) {}
}
