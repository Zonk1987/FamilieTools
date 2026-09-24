import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  const fastify = app.getHttpAdapter().getInstance();

  // Nest and Fastify plugins can resolve separate Fastify type identities
  // under pnpm even when they are runtime-compatible.
  await fastify.register(cookie as unknown as Parameters<typeof fastify.register>[0]);

  await fastify.register(helmet as unknown as Parameters<typeof fastify.register>[0], {
    contentSecurityPolicy: false,

    crossOriginEmbedderPolicy: false,

    referrerPolicy: {
      policy: 'no-referrer',
    },
  });

  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('X-Request-ID', request.id);

    done();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
}
