import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';
import { DatabaseService } from '../database/database.service.js';
import { authSessions, users } from '../database/schema/index.js';
import { PasswordService } from '../users/password.service.js';

describe('Authentication cookie integration', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let passwordService: PasswordService;

  const loginName = 'cookie-integration-test';
  const password = 'very-secure-cookie-password';

  let userId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();

    await app.getHttpAdapter().getInstance().ready();

    database = app.get(DatabaseService);
    passwordService = app.get(PasswordService);

    await database.db.delete(users).where(eq(users.loginName, loginName));

    const passwordHash = await passwordService.hash(password);

    const [user] = await database.db
      .insert(users)
      .values({
        loginName,
        displayName: 'Cookie Integration Test',
        passwordHash,
      })
      .returning({
        id: users.id,
      });

    if (!user) {
      throw new Error('Failed to create cookie integration test user');
    }

    userId = user.id;
  });

  afterAll(async () => {
    if (database && userId) {
      await database.db.delete(authSessions).where(eq(authSessions.userId, userId));

      await database.db.delete(users).where(eq(users.id, userId));
    }

    if (app) {
      await app.close();
    }
  });

  it('sets hardened session cookie attributes on login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName,
        password,
      })
      .expect(200);

    const setCookie = response.headers['set-cookie'];

    expect(setCookie).toBeDefined();

    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

    expect(cookieHeader).toContain('familietools_session=');

    expect(cookieHeader).toContain('HttpOnly');

    expect(cookieHeader).toContain('SameSite=Lax');

    expect(cookieHeader).toContain('Path=/');

    expect(cookieHeader).not.toContain('Secure');
  });

  it('clears the session cookie with matching attributes', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName,
        password,
      })
      .expect(200);

    const response = await agent
      .post('/api/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    const setCookie = response.headers['set-cookie'];

    expect(setCookie).toBeDefined();

    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

    expect(cookieHeader).toContain('familietools_session=');

    expect(cookieHeader).toContain('HttpOnly');

    expect(cookieHeader).toContain('SameSite=Lax');

    expect(cookieHeader).toContain('Path=/');
  });
});

describe('Authentication cookie integration in production', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let passwordService: PasswordService;

  const loginName = 'cookie-production-integration-test';

  const password = 'very-secure-production-cookie-password';

  const originalNodeEnv = process.env.NODE_ENV;

  let userId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();

    await app.getHttpAdapter().getInstance().ready();

    database = app.get(DatabaseService);

    passwordService = app.get(PasswordService);

    await database.db.delete(users).where(eq(users.loginName, loginName));

    const passwordHash = await passwordService.hash(password);

    const [user] = await database.db
      .insert(users)
      .values({
        loginName,
        displayName: 'Production Cookie Integration Test',
        passwordHash,
      })
      .returning({
        id: users.id,
      });

    if (!user) {
      throw new Error('Failed to create production cookie integration test user');
    }

    userId = user.id;
  });

  afterAll(async () => {
    if (database && userId) {
      await database.db.delete(authSessions).where(eq(authSessions.userId, userId));

      await database.db.delete(users).where(eq(users.id, userId));
    }

    if (app) {
      await app.close();
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('sets Secure on the session cookie in production', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginName,
        password,
      })
      .expect(200);

    const setCookie = response.headers['set-cookie'];

    expect(setCookie).toBeDefined();

    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

    expect(cookieHeader).toContain('familietools_session=');

    expect(cookieHeader).toContain('HttpOnly');

    expect(cookieHeader).toContain('Secure');

    expect(cookieHeader).toContain('SameSite=Lax');

    expect(cookieHeader).toContain('Path=/');
  });
});
