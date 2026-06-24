import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import type { JwtPayload } from '../../modules/auth/application/jwt-payload.interface'

function parseCookies(raw: string): Record<string, string> {
  return Object.fromEntries(
    raw.split(';').map((c) => {
      const idx = c.indexOf('=')
      return [c.slice(0, idx).trim(), decodeURIComponent(c.slice(idx + 1).trim())]
    }),
  )
}

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      // Accept token from HTTP-only cookie (sent with WS upgrade) or auth handshake
      const cookieHeader = client.handshake.headers.cookie ?? ''
      const cookies = parseCookies(cookieHeader)
      const token: string =
        cookies['access_token'] ??
        (client.handshake.auth as Record<string, string> | undefined)?.['token'] ??
        ''

      if (!token) throw new Error('missing token')

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.secret'),
      })

      // Scope the socket to its tenant room for targeted broadcasts
      if (payload.tenantSchema) {
        void client.join(payload.tenantSchema)
      }

      this.logger.log(`WS connected: ${client.id} (tenant: ${payload.tenantSchema ?? 'public'})`)
    } catch {
      client.emit('error', { message: 'Unauthorized' })
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS disconnected: ${client.id}`)
  }

  emitToTenant(tenantSchema: string, event: string, data: unknown): void {
    this.server.to(tenantSchema).emit(event, data)
  }
}
