import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildKeywordOr,
  parseOptionalBoolean,
} from '../../common/query.util';
import { CreateVehicleDto, QueryVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryVehicleDto = {}) {
    const keyword = query.keyword?.trim();
    const enabled = parseOptionalBoolean(query.enabled);
    const keywordOr = buildKeywordOr(keyword, [
      'code',
      'brandZh',
      'brandEn',
      'modelZh',
      'modelEn',
    ]);

    return this.prisma.vehicle.findMany({
      where: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(keywordOr ? { OR: keywordOr } : {}),
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async create(dto: CreateVehicleDto) {
    const exists = await this.prisma.vehicle.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new BadRequestException('车型编码已存在');
    return this.prisma.vehicle.create({ data: dto });
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.ensureExists(id);
    if (dto.code) {
      const exists = await this.prisma.vehicle.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (exists) throw new BadRequestException('车型编码已存在');
    }
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.vehicle.delete({ where: { id } });
    return true;
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('车型不存在');
    return row;
  }
}
