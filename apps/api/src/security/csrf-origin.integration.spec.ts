import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';

describe('CSRF origin protection integration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.WEB_ORIGIN = 'http://localhost:5173';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();

    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    delete process.env.WEB_ORIGIN;

    if (app) {
      await app.close();
    }
  });

  it('allows a mutating request with a session cookie and matching origin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'familietools_session=test-session-token')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).not.toBe(403);
  });

  it('rejects a mutating request with a session cookie and foreign origin', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'familietools_session=test-session-token')
      .set('Origin', 'https://evil.example')
      .expect(403);
  });

  it('rejects a mutating request with a session cookie and no origin information', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'familietools_session=test-session-token')
      .expect(403);
  });

  it('does not apply browser CSRF protection when no session cookie is present', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/login').send({
      loginName: 'csrf-no-cookie-test',
      password: 'incorrect-password',
    });

    expect(response.status).not.toBe(403);
  });

  it('allows safe requests without origin information', async () => {
    const response = await request(app.getHttpServer()).get('/api/setup/status');

    expect(response.status).not.toBe(403);
  });

  it('allows a mutating cookie request with a matching referer when origin is absent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'familietools_session=test-session-token')
      .set('Referer', 'http://localhost:5173/admin/settings');

    expect(response.status).not.toBe(403);
  });

  it('rejects a mutating cookie request with a foreign referer', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'familietools_session=test-session-token')
      .set('Referer', 'https://evil.example/phishing')
      .expect(403);
  });
});
