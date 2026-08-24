import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { NotifyModule } from './common/notify/notify.module';
import { PublicThrottleGuard } from './common/guards/public-throttle.guard';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { AssetsModule } from './modules/assets/assets.module';
import { BannersModule } from './modules/banners/banners.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { PublicModule } from './modules/public/public.module';
import { ExportImportModule } from './modules/export-import/export-import.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PageSeoModule } from './modules/page-seo/page-seo.module';
import { ServicesModule } from './modules/services/services.module';
import { SharesModule } from './modules/shares/shares.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { RolesModule } from './modules/roles/roles.module';
import { HomeVehiclesModule } from './modules/home-vehicles/home-vehicles.module';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    NotifyModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    AssetsModule,
    BannersModule,
    InquiriesModule,
    MessagesModule,
    ContactsModule,
    SiteSettingsModule,
    PublicModule,
    ExportImportModule,
    VehiclesModule,
    PageSeoModule,
    ServicesModule,
    SharesModule,
    OperationLogsModule,
    RolesModule,
    HomeVehiclesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PublicThrottleGuard },
    { provide: APP_INTERCEPTOR, useClass: OperationLogInterceptor },
  ],
})
export class AppModule {}
