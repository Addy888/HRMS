import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { winstonLoggerConfig } from './common/config/winston.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLoggerConfig,
  });

  // Security headers via Helmet (only in non-development to avoid localhost issues)
  if (process.env.NODE_ENV !== 'development') {
    app.use(helmet());
  } else {
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  }

  // CORS config
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Parsing cookies
  app.use(cookieParser());

  // Global prefixes
  app.setGlobalPrefix('api/v1');

  // Serve uploads statically
  const express = await import('express');
  const { join } = await import('path');
  const fs = await import('fs');
  
  // Ensure directories exist
  const uploadPath = join(process.cwd(), 'uploads/avatars');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Response Wrapper Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FCS HRMS API')
    .setDescription('Enterprise Human Resource Management System backend API endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`FCS HRMS backend API successfully running on: http://localhost:${port}/api/v1`);
}
bootstrap();
