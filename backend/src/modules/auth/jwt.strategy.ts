import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';

export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: string;
  employeeId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'fcs-hrms-super-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        employee: {
          select: { id: true, employeeId: true, onboardingStatus: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or does not exist');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      mustChangePassword: user.isFirstLogin,
      employeeId: user.employee?.id ?? null,
      employeeCode: user.employee?.employeeId ?? null,
    };
  }
}
