import { INestApplication } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'

export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly allowedOrigins: string[],
  ) {
    super(app)
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.allowedOrigins, credentials: true },
    })
  }
}
