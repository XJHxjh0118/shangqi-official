import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
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

  @Get('site-settings')
  @ApiOperation({ summary: '站点配置（公开）' })
  siteSettings() {
    return this.publicService.siteSettings();
  }

  @Get('home')
  @ApiOperation({ summary: '首页聚合数据（Banner + 产品区块 + 适配车型）' })
  home() {
    return this.publicService.home();
  }

  @Get('vehicle/list')
  @ApiOperation({ summary: '适配车型列表（公开）' })
  vehicles() {
    return this.publicService.vehicles();
  }

  @Get('home-vehicle/list')
  @ApiOperation({ summary: '首页适配车型（公开）' })
  homeVehicles() {
    return this.publicService.homeVehicles();
  }

  @Get('service/list')
  @ApiOperation({ summary: '服务体系（公开）' })
  services() {
    return this.publicService.services();
  }

  @Get('seo')
  @ApiOperation({ summary: '分页面 SEO（公开）' })
  pageSeo(@Query('pageKey') pageKey?: string) {
    return this.publicService.pageSeo(pageKey);
  }

  @Get('share/:token')
  @ApiOperation({ summary: '经销商分享只读页' })
  shareByToken(@Param('token') token: string) {
    return this.publicService.shareByToken(token);
  }

  @Get('banner/list')
  @ApiOperation({ summary: '首页 Banner' })
  banners() {
    return this.publicService.banners();
  }

  @Get('category/list')
  categories() {
    return this.publicService.categories();
  }

  @Get('contact/list')
  contacts() {
    return this.publicService.contacts();
  }

  @Get('product/list')
  products(@Query() query: PublicProductQueryDto) {
    return this.publicService.products(query);
  }

  @Get('product/asset-pack/:slug')
  @ApiOperation({ summary: '下载产品营销素材包（ZIP）' })
  @ApiProduces('application/zip')
  @Header('Cache-Control', 'no-store')
  downloadAssetPack(@Param('slug') slug: string): Promise<StreamableFile> {
    return this.publicService.downloadAssetPack(slug);
  }

  @Get('product/detail/:slug')
  productDetail(@Param('slug') slug: string) {
    return this.publicService.productBySlug(slug);
  }

  @Post('inquiry/add')
  createInquiry(@Body() dto: CreateInquiryDto) {
    return this.publicService.createInquiry(dto);
  }

  @Post('message/add')
  createMessage(@Body() dto: CreateContactMessageDto) {
    return this.publicService.createMessage(dto);
  }
}
