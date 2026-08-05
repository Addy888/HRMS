import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting socket connection: ${client.id}`);
      // Retrieve token from connection query or auth headers
      let token = client.handshake.auth?.token || client.handshake.query?.token;

      if (Array.isArray(token)) {
        token = token[0];
      }

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Handle 'Bearer <token>' format
      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trim();
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'fcs-hrms-super-secret-key';
      const payload = this.jwtService.verify(token, { secret });

      if (!payload || !payload.sub) {
        this.logger.warn(`Connection rejected: Invalid JWT payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = payload.sub;

      // Fetch user details including roles, department, designation to join appropriate rooms
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          employee: true,
        },
      });

      if (!user || !user.isActive) {
        this.logger.warn(`Connection rejected: User ${userId} is inactive or does not exist`);
        client.disconnect();
        return;
      }

      // Associate socket client with user metadata
      client.data.userId = user.id;
      client.data.role = user.role.name;
      client.data.email = user.email;

      // Join Personal Room
      await client.join(`user_${user.id}`);
      this.logger.log(`Client ${client.id} joined personal room user_${user.id}`);

      // Join Role Room (HR, EMPLOYEE, SUPER_ADMIN)
      await client.join(`role_${user.role.name}`);
      this.logger.log(`Client ${client.id} joined role room role_${user.role.name}`);

      // Join Department & Designation rooms if employee is set
      if (user.employee) {
        if (user.employee.departmentId) {
          await client.join(`dept_${user.employee.departmentId}`);
          this.logger.log(`Client ${client.id} joined department room dept_${user.employee.departmentId}`);
        }
        if (user.employee.designationId) {
          await client.join(`desg_${user.employee.designationId}`);
          this.logger.log(`Client ${client.id} joined designation room desg_${user.employee.designationId}`);
        }
      }

      // Emit connected confirmation
      client.emit('connected', { userId: user.id, status: 'authenticated' });
    } catch (error) {
      this.logger.error(`Socket connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} (User: ${client.data?.userId || 'unknown'})`);
  }

  /**
   * Helper to send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
    this.logger.log(`Emitted event "${event}" to room "user_${userId}"`);
  }

  /**
   * Helper to send notification to a role
   */
  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role_${role}`).emit(event, data);
    this.logger.log(`Emitted event "${event}" to room "role_${role}"`);
  }

  /**
   * Helper to send notification to a department
   */
  sendToDepartment(departmentId: string, event: string, data: any) {
    this.server.to(`dept_${departmentId}`).emit(event, data);
    this.logger.log(`Emitted event "${event}" to room "dept_${departmentId}"`);
  }

  /**
   * Helper to send notification to a designation
   */
  sendToDesignation(designationId: string, event: string, data: any) {
    this.server.to(`desg_${designationId}`).emit(event, data);
    this.logger.log(`Emitted event "${event}" to room "desg_${designationId}"`);
  }

  /**
   * Helper to send notification to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted event "${event}" to all connected clients`);
  }
}
