import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';

const DEFAULTS = {
  siteNameZh: '模板站点',
  siteNameEn: 'Template Site',
  seoKeywordsZh: '模板,官网,产品展示',
  seoKeywordsEn: 'template,website,product showcase',
  seoDescriptionZh: '通用官网模板，支持产品展示、意向咨询与站点配置。',
  seoDescriptionEn:
    'A generic official website template with product showcase, inquiry and site settings.',
  footerTextZh: '© 模板站点 · 可在后台配置站点信息',
  footerTextEn: '© Template Site · Configure branding in admin',
  aboutTitleZh: '关于我们',
  aboutTitleEn: 'About Us',
  aboutBodyZh: '这是一个通用官网模板，支持产品展示、多语言、站点配置与咨询留言。',
  aboutBodyEn:
    'A generic website template with product showcase, i18n, site settings and lead forms.',
};

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate() {
    const existing = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.siteSettings.create({ data: { id: 1, ...DEFAULTS } });
  }

  getPublic() {
    return this.getOrCreate();
  }

  async update(dto: UpdateSiteSettingsDto) {
    await this.getOrCreate();
    return this.prisma.siteSettings.update({
      where: { id: 1 },
      data: dto,
    });
  }
}
