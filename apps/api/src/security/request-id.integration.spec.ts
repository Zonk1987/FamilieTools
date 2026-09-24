import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';

describe('Request ID integration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        genReqId: () => 'test-request-id',
      }),
    );

    await configureApp(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns the Fastify request ID in the response header', async () => {
    const response = await request(app.getHttpServer()).get('/api').expect(200);

    expect(response.headers['x-request-id']).toBe('test-request-id');
  });
});
