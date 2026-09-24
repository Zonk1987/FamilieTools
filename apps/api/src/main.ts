import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.configure.js';
import { getAllowedWebOrigins } from './security/web-origins.js';
import { getTrustedProxies } from './security/trusted-proxies.js';
import { randomUUID } from 'node:crypto';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: getTrustedProxies(),
      genReqId: () => randomUUID(),
    }),
  );

  await configureApp(app);

  app.enableShutdownHooks();

  app.enableCors({
    origin: getAllowedWebOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FamilieTools API')
    .setDescription('API for the FamilieTools self-hosted family platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000, '0.0.0.0');
}

void bootstrap();
