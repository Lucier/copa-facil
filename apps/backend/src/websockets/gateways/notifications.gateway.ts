import { Logger } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  emitToTenant(tenantSchema: string, event: string, data: unknown): void {
    this.server.to(tenantSchema).emit(event, data)
  }
}
