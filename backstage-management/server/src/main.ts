import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { validationErrorMessage } from './common/http/validation-message';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

function resolveCorsOptions(config: ConfigService) {
  const raw = config.get<string>('CORS_ORIGINS');
  if (raw) {
    const origins = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return { origin: origins, credentials: true };
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[warn] CORS_ORIGINS 未设置，生产环境跨域请求将被拒绝',
    );
    return { origin: false, credentials: true };
  }

  return { origin: true, credentials: true };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('car');
  app.enableCors(resolveCorsOptions(config));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new BadRequestException(validationErrorMessage(errors)),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const uploadDir = config.get<string>('UPLOAD_DIR') || 'uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads/' });

  const swagger = new DocumentBuilder()
    .setTitle('Official Site Admin API')
    .setDescription('官网运营后台接口')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('car/docs', app, document);

  if (process.env.NODE_ENV !== 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      const value = config.get<string>(key) || '';
      if (!value || value.includes('change-me')) {
        console.warn(
          `[warn] ${key} 仍为默认值，上线前请在 server/.env 中修改`,
        );
      }
    }
  } else {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      const value = config.get<string>(key) || '';
      if (!value || value.includes('change-me')) {
        console.error(
          `[error] ${key} 仍为默认值，生产环境存在安全风险`,
        );
      }
    }
    if (!config.get<string>('CORS_ORIGINS')) {
      console.error(
        '[error] 生产环境未设置 CORS_ORIGINS，官网将无法跨域访问 API',
      );
    }
  }

  const port = Number(config.get('PORT') || 3001);
  await app.listen(port);
  console.log(`API running at http://localhost:${port}/car`);
  console.log(`Swagger at http://localhost:${port}/car/docs`);
}

bootstrap();
