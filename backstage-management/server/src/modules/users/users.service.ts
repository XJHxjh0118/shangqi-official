import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { pageResult, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, QueryUserDto, UpdateUserDto, userSelect } from './dto/user.dto';
import { SYSTEM_ROLE } from '../../common/system-role';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.kind === 'dealer'
        ? { role: SYSTEM_ROLE.DEALER }
        : query.kind === 'staff'
          ? query.role && query.role !== SYSTEM_ROLE.DEALER
            ? { role: query.role }
            : { role: { not: SYSTEM_ROLE.DEALER } }
          : query.role
            ? { role: query.role }
            : {}),
      ...(query.keyword
        ? {
            OR: [
              { username: { contains: query.keyword } },
              { nickname: { contains: query.keyword } },
              { email: { contains: query.keyword } },
              { company: { contains: query.keyword } },
              { contactName: { contains: query.keyword } },
            ],
          }
        : {}),
    };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return pageResult(list, total, page, pageSize);
  }

  async findOne(id: number) {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!row) throw new NotFoundException('用户不存在');
    return row;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });
    if (exists) throw new BadRequestException('用户名或邮箱已存在');
    await this.assertRole(dto.role ?? SYSTEM_ROLE.EDITOR);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        nickname: dto.nickname,
        role: dto.role ?? SYSTEM_ROLE.EDITOR,
        status: UserStatus.APPROVED,
        avatar: dto.avatar,
        email: dto.email,
        company: dto.company,
        contactName: dto.contactName,
        phone: dto.phone,
        region: dto.region,
        regionalManager: dto.regionalManager,
        address: dto.address,
        passwordHash,
      },
      select: userSelect,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (dto.role) await this.assertRole(dto.role);
    const data: Record<string, unknown> = {
      nickname: dto.nickname,
      avatar: dto.avatar,
      role: dto.role,
      enabled: dto.enabled,
      status: dto.status,
      email: dto.email,
      company: dto.company,
      contactName: dto.contactName,
      phone: dto.phone,
      region: dto.region,
      regionalManager: dto.regionalManager,
      address: dto.address,
    };
    if (dto.username) data.username = dto.username;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.username === 'admin') {
      throw new BadRequestException('默认管理员不可删除');
    }
    await this.prisma.user.delete({ where: { id } });
    return true;
  }

  async approve(id: number) {
    return this.update(id, {
      status: UserStatus.APPROVED,
      enabled: true,
    });
  }

  async reject(id: number) {
    return this.update(id, {
      status: UserStatus.REJECTED,
      enabled: false,
    });
  }

  async resetPassword(id: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    return true;
  }

  private async assertRole(code: string) {
    const role = await this.prisma.sysRole.findUnique({ where: { code } });
    if (!role) throw new BadRequestException('角色不存在');
    if (!role.enabled) throw new BadRequestException('角色已禁用');
  }
}
