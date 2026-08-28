import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { UpsertPageSeoDto } from './dto/page-seo.dto';
import { PageSeoService } from './page-seo.service';

@ApiTags('Page SEO')
@ApiBearerAuth()
@Controller('seo')
export class PageSeoController {
  constructor(private readonly pageSeoService: PageSeoService) {}

  @Post('list')
  findAll() {
    return this.pageSeoService.findAll();
  }

  @Post('detail/:pageKey')
  findOne(@Param('pageKey') pageKey: string) {
    return this.pageSeoService.findByKey(pageKey);
  }

  @Put('update')
  @Menus('seo', 'seo:pages', 'seo:home', 'seo:about')
  upsert(@Body() dto: UpsertPageSeoDto) {
    return this.pageSeoService.upsert(dto);
  }
}
