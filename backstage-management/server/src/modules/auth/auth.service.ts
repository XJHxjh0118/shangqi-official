import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { ALL_PERMISSION, SYSTEM_ROLE } from '../../common/system-role';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly rolesService: RolesService,
  ) {}

  private roleToFrontend(role: string) {
    return role.toLowerCase();
  }

  private async permissionsFor(role: string) {
    if (role === SYSTEM_ROLE.ADMIN) return [ALL_PERMISSION];
    return this.rolesService.getMenusByCode(role);
  }

  private assertActive(user: { enabled: boolean; status: string }) {
    if (!user.enabled || user.status !== 'APPROVED') {
      throw new UnauthorizedException('账号未通过审批或已禁用');
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.email }, { email: dto.email }],
      },
    });
    if (exists) throw new BadRequestException('该邮箱已注册');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.email,
        nickname: dto.contactName,
        email: dto.email,
        company: dto.company,
        contactName: dto.contactName,
        phone: dto.phone,
        region: dto.region,
        address: dto.address,
        passwordHash,
        role: SYSTEM_ROLE.DEALER,
        status: UserStatus.PENDING,
        enabled: true,
      },
      select: {
        id: true,
        email: true,
        company: true,
        contactName: true,
        status: true,
      },
    });
    return { ...user, message: '注册成功，请等待管理员审批' };
  }

  private buildTokens(user: {
    id: number;
    username: string;
    role: string;
  }) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') || '7d') as any,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '30d') as any,
    });

    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
    const expiresMs = decoded?.exp
      ? decoded.exp * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;
    const expires = new Date(expiresMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expiresText = `${expires.getFullYear()}/${pad(expires.getMonth() + 1)}/${pad(expires.getDate())} ${pad(expires.getHours())}:${pad(expires.getMinutes())}:${pad(expires.getSeconds())}`;

    return { accessToken, refreshToken, expires: expiresText };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.username }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    this.assertActive(user);

    const tokens = this.buildTokens(user);
    return {
      avatar: user.avatar || '',
      username: user.username,
      nickname: user.nickname,
      roles: [this.roleToFrontend(user.role)],
      permissions: await this.permissionsFor(user.role),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: number; username: string; role: string };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('用户无效');
      }
      this.assertActive(user);
      return this.buildTokens(user);
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async profile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('未登录或登录已过期');
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      company: user.company,
      contactName: user.contactName,
      phone: user.phone,
      region: user.region,
      address: user.address,
      status: user.status,
      roles: [this.roleToFrontend(user.role)],
      permissions: await this.permissionsFor(user.role),
    };
  }
}
