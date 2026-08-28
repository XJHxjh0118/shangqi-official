import {
  Body,
  Controller,
  Header,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import {
  CreateContactMessageDto,
  CreateInquiryDto,
  PublicProductQueryDto,
} from './dto/public.dto';
import { PublicService } from './public.service';

@ApiTags('Public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('site-settings')
  @ApiOperation({ summary: '站点配置（公开）' })
  siteSettings() {
    return this.publicService.siteSettings();
  }

  @Post('home')
  @ApiOperation({ summary: '首页聚合数据（Banner + 产品区块 + 适配车型）' })
  home() {
    return this.publicService.home();
  }

  @Post('vehicle/list')
  @ApiOperation({ summary: '适配车型列表（公开）' })
  vehicles() {
    return this.publicService.vehicles();
  }

  @Post('home-vehicle/list')
  @ApiOperation({ summary: '首页适配车型（公开）' })
  homeVehicles() {
    return this.publicService.homeVehicles();
  }

  @Post('service/list')
  @ApiOperation({ summary: '服务体系（公开）' })
  services() {
    return this.publicService.services();
  }

  @Post('seo')
  @ApiOperation({ summary: '分页面 SEO（公开）' })
  pageSeo(@Body('pageKey') pageKey?: string) {
    return this.publicService.pageSeo(pageKey);
  }

  @Post('share/:token')
  @ApiOperation({ summary: '经销商分享只读页' })
  shareByToken(@Param('token') token: string) {
    return this.publicService.shareByToken(token);
  }

  @Post('banner/list')
  @ApiOperation({ summary: '首页 Banner' })
  banners() {
    return this.publicService.banners();
  }

  @Post('category/list')
  categories() {
    return this.publicService.categories();
  }

  @Post('contact/list')
  contacts() {
    return this.publicService.contacts();
  }

  @Post('product/list')
  products(@Body() query: PublicProductQueryDto) {
    return this.publicService.products(query);
  }

  @Post('product/asset-pack/:slug')
  @ApiOperation({ summary: '下载产品营销素材包（ZIP）' })
  @ApiProduces('application/zip')
  @Header('Cache-Control', 'no-store')
  downloadAssetPack(@Param('slug') slug: string): Promise<StreamableFile> {
    return this.publicService.downloadAssetPack(slug);
  }

  @Post('product/detail/:slug')
  productDetail(@Param('slug') slug: string) {
    return this.publicService.productBySlug(slug);
  }

  @Post('inquiry/add')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '提交询盘（登录时自动关联账号）' })
  createInquiry(
    @Body() dto: CreateInquiryDto,
    @CurrentUser() user?: { id?: number } | null,
  ) {
    return this.publicService.createInquiry(dto, user?.id);
  }

  @Post('message/add')
  createMessage(@Body() dto: CreateContactMessageDto) {
    return this.publicService.createMessage(dto);
  }
}
