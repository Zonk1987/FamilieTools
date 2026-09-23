import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';

describe('Authentication rate limiting integration', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();

    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rate limits repeated attempts against the same login identity', async () => {
    const loginName = 'rate-limit-account-test';

    for (let attempt = 1; attempt <= 8; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginName,
          password: 'incorrect-password',
        })
        .expect(401);
    }

    const blockedResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName,
        password: 'incorrect-password',
      })
      .expect(429);

    expect(blockedResponse.body).toEqual(
      expect.objectContaining({
        statusCode: 429,
      }),
    );
  });

  it('does not leak an account rate limit to a different login identity', async () => {
    const blockedLoginName = 'rate-limit-blocked-account-test';

    for (let attempt = 1; attempt <= 8; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginName: blockedLoginName,
          password: 'incorrect-password',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName: blockedLoginName,
        password: 'incorrect-password',
      })
      .expect(429);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName: 'different-rate-limit-account-test',
        password: 'incorrect-password',
      })
      .expect(401);
  });

  it('rate limits password spraying from one client across different login identities', async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginName: `spray-target-${attempt}`,
          password: 'incorrect-password',
        })
        .expect(401);
    }

    const blockedResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName: 'spray-target-blocked',
        password: 'incorrect-password',
      })
      .expect(429);

    expect(blockedResponse.body).toEqual(
      expect.objectContaining({
        statusCode: 429,
      }),
    );
  });
});
