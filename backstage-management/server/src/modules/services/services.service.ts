import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
} from './dto/service-item.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceItem.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  findPublic() {
    return this.prisma.serviceItem.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async create(dto: CreateServiceItemDto) {
    const exists = await this.prisma.serviceItem.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new BadRequestException('服务编码已存在');
    return this.prisma.serviceItem.create({ data: dto });
  }

  async update(id: number, dto: UpdateServiceItemDto) {
    await this.ensureExists(id);
    if (dto.code) {
      const exists = await this.prisma.serviceItem.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (exists) throw new BadRequestException('服务编码已存在');
    }
    return this.prisma.serviceItem.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.serviceItem.delete({ where: { id } });
    return true;
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('服务条目不存在');
    return row;
  }
}
