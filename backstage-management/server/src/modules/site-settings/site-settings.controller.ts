import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings')
@ApiBearerAuth()
@Controller('cms/site-settings')
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Post('detail')
  @Menus('cms:banner', 'cms:featured', 'cms:new-hot', 'cms:service', 'seo:pages')
  @ApiOperation({ summary: '获取站点配置' })
  get() {
    return this.service.getOrCreate();
  }

  @Put('update')
  @Menus('cms:banner', 'cms:featured', 'cms:new-hot', 'cms:service', 'seo:pages')
  @ApiOperation({ summary: '更新站点配置' })
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.service.update(dto);
  }
}
