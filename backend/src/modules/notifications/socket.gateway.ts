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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 SOCKET GATEWAY: Connection attempt');
    console.log('   Socket ID:', client.id);
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   Client Address:', client.handshake.address);
    console.log('   Transport:', client.conn.transport.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      this.logger.log(`Client attempting socket connection: ${client.id}`);
      
      console.log('🔐 SOCKET GATEWAY: Checking authentication');
      console.log('   Auth object:', JSON.stringify(client.handshake.auth || {}, null, 2));
      console.log('   Query object:', JSON.stringify(client.handshake.query || {}, null, 2));
      console.log('   Headers:', JSON.stringify(client.handshake.headers || {}, null, 2));
      
      // Retrieve token from connection query or auth headers
      let token = client.handshake.auth?.token || client.handshake.query?.token;

      if (Array.isArray(token)) {
        console.log('⚠️  SOCKET GATEWAY: Token is array, taking first element');
        token = token[0];
      }

      console.log('🎫 SOCKET GATEWAY: Token extracted:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

      if (!token) {
        console.error('❌ SOCKET GATEWAY: Connection rejected - No token provided');
        console.error('   Socket ID:', client.id);
        console.error('   Auth payload:', JSON.stringify(client.handshake.auth));
        console.error('   Query params:', JSON.stringify(client.handshake.query));
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        this.logger.warn(
          `Connection rejected: No token provided for client ${client.id}`,
        );
        client.disconnect();
        return;
      }

      // Handle 'Bearer <token>' format
      if (token.startsWith('Bearer ')) {
        console.log('🔄 SOCKET GATEWAY: Removing "Bearer " prefix from token');
        token = token.slice(7, token.length).trim();
      }

      console.log('🔓 SOCKET GATEWAY: Verifying JWT token...');
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'fcs-hrms-super-secret-key';
      
      console.log('   JWT Secret (first 10 chars):', secret.substring(0, 10) + '...');
      
      const payload = this.jwtService.verify(token, { secret });
      
      console.log('✅ SOCKET GATEWAY: JWT verified successfully');
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      if (!payload || !payload.sub) {
        console.error('❌ SOCKET GATEWAY: Connection rejected - Invalid JWT payload');
        console.error('   Socket ID:', client.id);
        console.error('   Payload:', JSON.stringify(payload));
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        this.logger.warn(
          `Connection rejected: Invalid JWT payload for client ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      console.log('👤 SOCKET GATEWAY: Extracted user ID:', userId);

      console.log('💾 SOCKET GATEWAY: Fetching user from database...');
      // Fetch user details including roles, department, designation to join appropriate rooms
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          employee: true,
        },
      });

      console.log('📦 SOCKET GATEWAY: User query result:', user ? 'Found' : 'Not found');
      if (user) {
        console.log('   User ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role?.name);
        console.log('   Is Active:', user.isActive);
        console.log('   Has Employee:', !!user.employee);
      }

      if (!user || !user.isActive) {
        console.error('❌ SOCKET GATEWAY: Connection rejected - User inactive or not found');
        console.error('   Socket ID:', client.id);
        console.error('   User ID:', userId);
        console.error('   User exists:', !!user);
        console.error('   User active:', user?.isActive);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        this.logger.warn(
          `Connection rejected: User ${userId} is inactive or does not exist`,
        );
        client.disconnect();
        return;
      }

      console.log('✅ SOCKET GATEWAY: Associating socket with user metadata');
      // Associate socket client with user metadata
      client.data.userId = user.id;
      client.data.role = user.role.name;
      client.data.email = user.email;

      console.log('🚪 SOCKET GATEWAY: Joining rooms...');
      // Join Personal Room
      await client.join(`user_${user.id}`);
      console.log('   ✓ Joined personal room: user_' + user.id);
      this.logger.log(
        `Client ${client.id} joined personal room user_${user.id}`,
      );

      // Join Role Room (HR, EMPLOYEE, SUPER_ADMIN)
      await client.join(`role_${user.role.name}`);
      console.log('   ✓ Joined role room: role_' + user.role.name);
      this.logger.log(
        `Client ${client.id} joined role room role_${user.role.name}`,
      );

      // Join Department & Designation rooms if employee is set
      if (user.employee) {
        if (user.employee.departmentId) {
          await client.join(`dept_${user.employee.departmentId}`);
          console.log('   ✓ Joined department room: dept_' + user.employee.departmentId);
          this.logger.log(
            `Client ${client.id} joined department room dept_${user.employee.departmentId}`,
          );
        }
        if (user.employee.designationId) {
          await client.join(`desg_${user.employee.designationId}`);
          console.log('   ✓ Joined designation room: desg_' + user.employee.designationId);
          this.logger.log(
            `Client ${client.id} joined designation room desg_${user.employee.designationId}`,
          );
        }
      }

      console.log('📡 SOCKET GATEWAY: Emitting "connected" event to client');
      // Emit connected confirmation
      client.emit('connected', { userId: user.id, status: 'authenticated' });
      
      console.log('✅ SOCKET GATEWAY: Connection successful');
      console.log('   Socket ID:', client.id);
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (error) {
      console.error('❌ SOCKET GATEWAY: Connection error');
      console.error('   Socket ID:', client.id);
      console.error('   Error Type:', error.constructor.name);
      console.error('   Error Name:', error.name);
      console.error('   Error Message:', error.message);
      console.error('   Error Code:', error.code);
      console.error('   Stack Trace:');
      console.error(error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      this.logger.error(
        `Socket connection error for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (User: ${client.data?.userId || 'unknown'})`,
    );
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
