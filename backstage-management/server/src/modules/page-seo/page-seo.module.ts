import { Module } from '@nestjs/common';
import { PageSeoController } from './page-seo.controller';
import { PageSeoService } from './page-seo.service';

@Module({
  controllers: [PageSeoController],
  providers: [PageSeoService],
  exports: [PageSeoService],
})
export class PageSeoModule {}
