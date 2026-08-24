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
import {
  CreateHomeVehicleDto,
  UpdateHomeVehicleDto,
} from './dto/home-vehicle.dto';
import { HomeVehiclesService } from './home-vehicles.service';

@ApiTags('Home Vehicles')
@ApiBearerAuth()
@Controller('cms/vehicle')
export class HomeVehiclesController {
  constructor(private readonly homeVehiclesService: HomeVehiclesService) {}

  @Get('list')
  findAll() {
    return this.homeVehiclesService.findAll();
  }

  @Get('options')
  findOptions() {
    return this.homeVehiclesService.findOptions();
  }

  @Post('add')
  @Menus('cms:vehicle')
  create(@Body() dto: CreateHomeVehicleDto) {
    return this.homeVehiclesService.create(dto);
  }

  @Patch('update/:id')
  @Menus('cms:vehicle')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHomeVehicleDto,
  ) {
    return this.homeVehiclesService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('cms:vehicle')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeVehiclesService.remove(id);
  }
}
