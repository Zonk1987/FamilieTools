import cookie from '@fastify/cookie';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  const fastify = app.getHttpAdapter().getInstance();

  // Nest and @fastify/cookie can resolve separate Fastify type identities
  // under pnpm even when they are runtime-compatible.
  await fastify.register(cookie as unknown as Parameters<typeof fastify.register>[0]);

  app.setGlobalPrefix('api');
}
