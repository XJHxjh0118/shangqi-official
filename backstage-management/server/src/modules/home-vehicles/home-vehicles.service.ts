import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateHomeVehicleDto,
  UpdateHomeVehicleDto,
} from './dto/home-vehicle.dto';

const vehicleSelect = {
  id: true,
  code: true,
  brandZh: true,
  brandEn: true,
  modelZh: true,
  modelEn: true,
  yearFrom: true,
  yearTo: true,
  enabled: true,
} as const;

@Injectable()
export class HomeVehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.homeVehicle.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { vehicle: { select: vehicleSelect } },
    });
  }

  findOptions() {
    return this.prisma.vehicle.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: vehicleSelect,
    });
  }

  findPublic() {
    return this.prisma.homeVehicle.findMany({
      where: { enabled: true, vehicle: { enabled: true } },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { vehicle: { select: vehicleSelect } },
    });
  }

  async create(dto: CreateHomeVehicleDto) {
    await this.ensureVehicle(dto.vehicleId);
    const exists = await this.prisma.homeVehicle.findUnique({
      where: { vehicleId: dto.vehicleId },
    });
    if (exists) throw new BadRequestException('该车型已配置到首页');
    return this.prisma.homeVehicle.create({
      data: dto,
      include: { vehicle: { select: vehicleSelect } },
    });
  }

  async update(id: number, dto: UpdateHomeVehicleDto) {
    await this.ensureExists(id);
    if (dto.vehicleId != null) {
      await this.ensureVehicle(dto.vehicleId);
      const conflict = await this.prisma.homeVehicle.findFirst({
        where: { vehicleId: dto.vehicleId, NOT: { id } },
      });
      if (conflict) throw new BadRequestException('该车型已配置到首页');
    }
    return this.prisma.homeVehicle.update({
      where: { id },
      data: dto,
      include: { vehicle: { select: vehicleSelect } },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.homeVehicle.delete({ where: { id } });
    return true;
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.homeVehicle.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('首页车型不存在');
    return row;
  }

  private async ensureVehicle(vehicleId: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new BadRequestException('车型不存在');
  }
}
