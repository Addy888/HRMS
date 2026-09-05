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
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  }

  // CORS config - Support localhost and LAN IP ranges
  const getAllowedOrigins = () => {
    const envOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
    
    if (process.env.NODE_ENV === 'production') {
      return envOrigins.length > 0 ? envOrigins : false;
    }
    
    // Development: Support localhost and LAN IP addresses
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Merge with environment origins
    return [...defaultOrigins, ...envOrigins];
  };

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // In production with no CORS_ORIGIN set, block all origins
      if (allowedOrigins === false) {
        return callback(new Error('CORS not configured for production'), false);
      }
      
      // In development, allow localhost and LAN IPs (192.168.x.x, 10.x.x.x)
      if (process.env.NODE_ENV === 'development') {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isLAN = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
        
        if (isLocalhost || isLAN || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      
      // Check if origin is in allowed list
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Reject origin
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
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
    .setDescription(
      'Enterprise Human Resource Management System backend API endpoints',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`✅ FCS HRMS Production API running on port ${port}`);
  } else {
    console.log(`🚀 FCS HRMS Development API: http://localhost:${port}/api/v1`);
  }
}
bootstrap();
