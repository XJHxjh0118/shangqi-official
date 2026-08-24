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
  CreateServiceItemDto,
  UpdateServiceItemDto,
} from './dto/service-item.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('cms/service')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('list')
  findAll() {
    return this.servicesService.findAll();
  }

  @Post('add')
  @Menus('cms:service')
  create(@Body() dto: CreateServiceItemDto) {
    return this.servicesService.create(dto);
  }

  @Patch('update/:id')
  @Menus('cms:service')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceItemDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('cms:service')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}
