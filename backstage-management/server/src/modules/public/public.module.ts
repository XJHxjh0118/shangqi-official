import { Module } from '@nestjs/common';
import { PageSeoModule } from '../page-seo/page-seo.module';
import { ServicesModule } from '../services/services.module';
import { SharesModule } from '../shares/shares.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [SiteSettingsModule, PageSeoModule, ServicesModule, SharesModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
