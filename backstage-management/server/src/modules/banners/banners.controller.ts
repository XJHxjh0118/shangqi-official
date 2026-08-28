import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { BannersService } from './banners.service';
import {
  CreateBannerDto,
  QueryBannerDto,
  ReorderBannersDto,
  UpdateBannerDto,
} from './dto/banner.dto';

@ApiTags('Banners')
@ApiBearerAuth()
@Controller('cms/banner')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post('list')
  findAll(@Body() query: QueryBannerDto) {
    return this.bannersService.findAll(query);
  }

  @Post('add')
  @Menus('cms:banner')
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch('sort')
  @Menus('cms:banner')
  reorder(@Body() dto: ReorderBannersDto) {
    return this.bannersService.reorder(dto.ids);
  }

  @Patch('update/:id')
  @Menus('cms:banner')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.bannersService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('cms:banner')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }
}
