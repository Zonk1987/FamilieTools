import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';

describe('Security headers integration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();

    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('adds the expected browser security headers', async () => {
    const response = await request(app.getHttpServer()).get('/api/setup/status').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');

    expect(response.headers['referrer-policy']).toBe('no-referrer');

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('does not enable CSP before a dedicated policy is configured', async () => {
    const response = await request(app.getHttpServer()).get('/api/setup/status').expect(200);

    expect(response.headers['content-security-policy']).toBeUndefined();
  });

  it('does not enable cross-origin embedder policy yet', async () => {
    const response = await request(app.getHttpServer()).get('/api/setup/status').expect(200);

    expect(response.headers['cross-origin-embedder-policy']).toBeUndefined();
  });
});
