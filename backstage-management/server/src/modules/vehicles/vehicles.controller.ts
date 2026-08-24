import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('product/vehicle')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('list')
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Post('add')
  @Menus('product:vehicle')
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch('update/:id')
  @Menus('product:vehicle')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('product:vehicle')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id);
  }
}
