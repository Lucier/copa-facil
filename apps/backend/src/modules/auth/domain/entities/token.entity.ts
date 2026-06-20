export class TokenEntity {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly accessExpiresIn: number,
  ) {}
}
