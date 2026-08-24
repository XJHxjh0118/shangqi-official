import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALL_MENUS,
  EDITOR_MENUS,
  MENU_CATALOG,
  isValidMenuKey,
  normalizeMenuKey,
  normalizeMenuKeys,
} from '../../common/menu-catalog';
import { ALL_PERMISSION, SYSTEM_ROLE } from '../../common/system-role';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

function parseMenus(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const keys = Array.isArray(parsed)
      ? parsed.filter((i) => typeof i === 'string')
      : [];
    return normalizeMenuKeys(keys);
  } catch {
    return [];
  }
}

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSystemRoles();
  }

  menuCatalog() {
    return MENU_CATALOG;
  }

  async ensureSystemRoles() {
    const defaults = [
      {
        code: SYSTEM_ROLE.ADMIN,
        name: '管理员',
        description: '全部后台菜单与操作权限',
        menus: ALL_MENUS,
        isSystem: true,
        sort: 1,
      },
      {
        code: SYSTEM_ROLE.EDITOR,
        name: '运营',
        description: '产品分类、产品、首页内容、SEO',
        menus: EDITOR_MENUS,
        isSystem: true,
        sort: 2,
      },
      {
        code: SYSTEM_ROLE.DEALER,
        name: '经销商',
        description: '前台经销商账号，不进入后台菜单',
        menus: [] as string[],
        isSystem: true,
        sort: 99,
      },
    ];

    for (const item of defaults) {
      const exists = await this.prisma.sysRole.findUnique({
        where: { code: item.code },
      });
      if (!exists) {
        await this.prisma.sysRole.create({
          data: {
            code: item.code,
            name: item.name,
            description: item.description,
            menus: JSON.stringify(item.menus),
            isSystem: item.isSystem,
            sort: item.sort,
            enabled: true,
          },
        });
        continue;
      }
      const nextMenus = parseMenus(exists.menus);
      const data: Record<string, unknown> = {};
      if (
        item.code === SYSTEM_ROLE.EDITOR &&
        !nextMenus.includes('cms:vehicle')
      ) {
        data.menus = JSON.stringify([...nextMenus, 'cms:vehicle']);
      } else if (JSON.stringify(nextMenus) !== exists.menus) {
        data.menus = JSON.stringify(nextMenus);
      }
      if (
        item.code === SYSTEM_ROLE.EDITOR &&
        exists.description !== item.description
      ) {
        data.description = item.description;
      }
      if (Object.keys(data).length) {
        await this.prisma.sysRole.update({
          where: { code: item.code },
          data,
        });
      }
    }
    await this.migrateStoredMenus();
  }

  private async migrateStoredMenus() {
    const roles = await this.prisma.sysRole.findMany();
    for (const row of roles) {
      if (row.code === SYSTEM_ROLE.ADMIN || row.code === SYSTEM_ROLE.EDITOR) {
        continue;
      }
      const next = parseMenus(row.menus);
      if (JSON.stringify(next) === row.menus) continue;
      await this.prisma.sysRole.update({
        where: { id: row.id },
        data: { menus: JSON.stringify(next) },
      });
    }
  }

  async findAll() {
    await this.ensureSystemRoles();
    const list = await this.prisma.sysRole.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return list.map((row) => this.toDto(row));
  }

  async findStaffRoles() {
    const list = await this.findAll();
    return list.filter(
      (row) => row.code !== SYSTEM_ROLE.DEALER && row.enabled,
    );
  }

  async getMenusByCode(code: string): Promise<string[]> {
    if (code === SYSTEM_ROLE.ADMIN) return [ALL_PERMISSION, ...ALL_MENUS];
    const row = await this.prisma.sysRole.findUnique({ where: { code } });
    if (!row || !row.enabled) {
      if (code === SYSTEM_ROLE.EDITOR) return EDITOR_MENUS;
      return [];
    }
    return parseMenus(row.menus);
  }

  hasMenu(granted: string[], required: string[]) {
    const normalized = normalizeMenuKeys(granted);
    if (normalized.includes(ALL_PERMISSION)) return true;
    return required.some((key) => {
      const needed = normalizeMenuKey(key);
      return (
        normalized.includes(needed) ||
        normalized.includes(needed.split(':')[0]) ||
        normalized.some((g) => g.startsWith(`${needed}:`))
      );
    });
  }

  async create(dto: CreateRoleDto) {
    const code = dto.code.trim().toUpperCase();
    const exists = await this.prisma.sysRole.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('角色标识已存在');
    const menus = this.normalizeMenus(dto.menus);
    return this.toDto(
      await this.prisma.sysRole.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description?.trim() || '',
          menus: JSON.stringify(menus),
          enabled: dto.enabled !== false,
          isSystem: false,
          sort: 50,
        },
      }),
    );
  }

  async update(id: number, dto: UpdateRoleDto) {
    const row = await this.prisma.sysRole.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('角色不存在');
    if (row.code === SYSTEM_ROLE.ADMIN && dto.enabled === false) {
      throw new BadRequestException('管理员角色不可禁用');
    }
    if (row.code === SYSTEM_ROLE.DEALER && dto.menus) {
      throw new BadRequestException('经销商角色不配置后台菜单');
    }
    const data: Record<string, unknown> = {};
    if (dto.name != null) data.name = dto.name.trim();
    if (dto.description != null) data.description = dto.description.trim();
    if (dto.enabled != null) data.enabled = dto.enabled;
    if (dto.menus) {
      data.menus = JSON.stringify(
        row.code === SYSTEM_ROLE.ADMIN
          ? ALL_MENUS
          : this.normalizeMenus(dto.menus),
      );
    }
    return this.toDto(
      await this.prisma.sysRole.update({ where: { id }, data }),
    );
  }

  async remove(id: number) {
    const row = await this.prisma.sysRole.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('角色不存在');
    if (row.isSystem) {
      throw new BadRequestException('系统内置角色不可删除');
    }
    const used = await this.prisma.user.count({ where: { role: row.code } });
    if (used > 0) {
      throw new BadRequestException(`仍有 ${used} 个账号使用该角色，无法删除`);
    }
    await this.prisma.sysRole.delete({ where: { id } });
    return true;
  }

  private normalizeMenus(menus?: string[]) {
    const unique = [...new Set((menus || []).map((i) => i.trim()).filter(Boolean))];
    const invalid = unique.filter((key) => !isValidMenuKey(key));
    if (invalid.length) {
      throw new BadRequestException(`无效菜单：${invalid.join(', ')}`);
    }
    return unique;
  }

  private toDto(row: {
    id: number;
    code: string;
    name: string;
    description: string;
    menus: string;
    isSystem: boolean;
    enabled: boolean;
    sort: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...row,
      menus: parseMenus(row.menus),
    };
  }
}
