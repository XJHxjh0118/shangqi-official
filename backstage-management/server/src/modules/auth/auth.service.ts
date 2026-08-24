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
import { NotifyService } from '../../common/notify/notify.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/login.dto';
import { ALL_PERMISSION, SYSTEM_ROLE } from '../../common/system-role';
import { RolesService } from '../roles/roles.service';

const RESET_PURPOSE = 'RESET_PASSWORD';
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_RESEND_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly rolesService: RolesService,
    private readonly notify: NotifyService,
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

  private normalizeAccount(raw: string) {
    return raw.trim().replace(/\s+/g, ' ');
  }

  private isEmailAccount(account: string) {
    return account.includes('@');
  }

  private async findByAccount(account: string) {
    const value = this.normalizeAccount(account);
    if (!value) return null;
    if (this.isEmailAccount(value)) {
      const email = value.toLowerCase();
      return this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username: email }, { username: value }],
        },
      });
    }
    return this.prisma.user.findFirst({
      where: { phone: value },
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: email }, { email }],
      },
    });
    if (exists) throw new BadRequestException('该邮箱已注册');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: email,
        nickname: dto.contactName,
        email,
        company: dto.company,
        contactName: dto.contactName,
        phone: dto.phone?.trim() || null,
        region: dto.region,
        regionalManager: dto.regionalManager,
        address: dto.address?.trim() || null,
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
        phone: true,
        region: true,
        regionalManager: true,
        address: true,
        status: true,
      },
    });

    await this.notify.send({
      subject: `新经销商注册：${dto.company}`,
      text: [
        `公司：${dto.company}`,
        `联系人：${dto.contactName}`,
        `邮箱：${email}`,
        `国家/地区：${dto.region}`,
        `区域经理：${dto.regionalManager}`,
        dto.phone ? `电话：${dto.phone}` : '',
        '状态：待审批（先批后审）',
      ]
        .filter(Boolean)
        .join('\n'),
    });

    await this.notify.sendTo(email, {
      subject: '经销商注册已提交，等待审批',
      text: [
        `${dto.contactName}，您好。`,
        `我们已收到 ${dto.company} 的经销商注册申请。`,
        '账号将先进入待审批状态，管理员审核通过后即可登录门户。',
        `登录邮箱：${email}`,
      ].join('\n'),
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
      regionalManager: user.regionalManager,
      address: user.address,
      status: user.status,
      roles: [this.roleToFrontend(user.role)],
      permissions: await this.permissionsFor(user.role),
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('未登录或登录已过期');

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== user.email) {
      const taken = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username: email }],
          NOT: { id: userId },
        },
      });
      if (taken) throw new BadRequestException('该邮箱已被使用');
    }

    const nextEmail = email || user.email;
    const username =
      email && user.username === user.email ? email : user.username;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        contactName: dto.contactName ?? user.contactName,
        nickname: dto.contactName || user.nickname,
        phone: dto.phone !== undefined ? dto.phone.trim() || null : user.phone,
        address:
          dto.address !== undefined ? dto.address.trim() || null : user.address,
        email: nextEmail,
        username,
      },
    });

    return this.profile(updated.id);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('未登录或登录已过期');
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('当前密码不正确');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: '密码已更新' };
  }

  async sendResetCode(account: string) {
    const user = await this.findByAccount(account);
    if (!user) {
      throw new BadRequestException('未找到该邮箱或手机号对应的账号');
    }
    const key = this.normalizeAccount(account).toLowerCase();
    const recent = await this.prisma.verificationCode.findFirst({
      where: {
        account: key,
        purpose: RESET_PURPOSE,
        usedAt: null,
        createdAt: { gt: new Date(Date.now() - CODE_RESEND_MS) },
      },
      orderBy: { id: 'desc' },
    });
    if (recent) {
      throw new BadRequestException('验证码已发送，请稍后再试');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.verificationCode.create({
      data: {
        account: key,
        purpose: RESET_PURPOSE,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    const to = user.email;
    let mailed = false;
    if (to) {
      mailed = await this.notify.sendTo(to, {
        subject: '经销商门户密码重置验证码',
        text: [
          `${user.contactName || user.nickname}，您好。`,
          `您的密码重置验证码是 ${code}，10 分钟内有效。`,
          '如非本人操作，请忽略此邮件。',
        ].join('\n'),
      });
    }

    const dev =
      process.env.NODE_ENV !== 'production' && !this.notify.hasSmtpTransport();
    return {
      sent: true,
      via: mailed ? 'email' : 'log',
      masked: this.maskTarget(to || user.phone || account),
      ...(dev ? { devCode: code } : {}),
    };
  }

  async resetPassword(account: string, code: string, password: string) {
    const user = await this.findByAccount(account);
    if (!user) {
      throw new BadRequestException('未找到该邮箱或手机号对应的账号');
    }
    const key = this.normalizeAccount(account).toLowerCase();
    const row = await this.prisma.verificationCode.findFirst({
      where: {
        account: key,
        purpose: RESET_PURPOSE,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { id: 'desc' },
    });
    if (!row) {
      throw new BadRequestException('验证码错误或已过期');
    }
    const ok = await bcrypt.compare(code.trim(), row.codeHash);
    if (!ok) throw new BadRequestException('验证码错误或已过期');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      }),
      this.prisma.verificationCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: '密码已重置，请使用新密码登录' };
  }

  private maskTarget(value: string) {
    const v = value.trim();
    if (v.includes('@')) {
      const [name, domain] = v.split('@');
      const head = name.slice(0, 1);
      return `${head}***@${domain}`;
    }
    if (v.length >= 7) {
      return `${v.slice(0, 3)}****${v.slice(-4)}`;
    }
    return '***';
  }
}
