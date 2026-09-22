import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { configureApp } from '../app.configure.js';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { DatabaseService } from '../database/database.service.js';
import { authSessions, platformRoles, platformUserRoles, users } from '../database/schema/index.js';
import { PasswordService } from '../users/password.service.js';
import { PLATFORM_OWNER_ROLE_KEY } from '../platform-auth/platform-capabilities.js';
import { eq } from 'drizzle-orm';

describe('Authentication integration', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let passwordService: PasswordService;

  const ownerLoginName = 'auth-owner-test';
  const ownerPassword = 'very-secure-owner-password';

  const normalLoginName = 'auth-user-test';
  const normalPassword = 'very-secure-user-password';

  let ownerUserId: string;
  let normalUserId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    database = app.get(DatabaseService);
    passwordService = app.get(PasswordService);

    await database.db.delete(users).where(eq(users.loginName, ownerLoginName));

    await database.db.delete(users).where(eq(users.loginName, normalLoginName));

    const ownerPasswordHash = await passwordService.hash(ownerPassword);

    const normalPasswordHash = await passwordService.hash(normalPassword);

    const [ownerUser] = await database.db
      .insert(users)
      .values({
        loginName: ownerLoginName,
        displayName: 'Auth Owner Test',
        passwordHash: ownerPasswordHash,
      })
      .returning({
        id: users.id,
      });

    const [normalUser] = await database.db
      .insert(users)
      .values({
        loginName: normalLoginName,
        displayName: 'Auth User Test',
        passwordHash: normalPasswordHash,
      })
      .returning({
        id: users.id,
      });

    if (!ownerUser || !normalUser) {
      throw new Error('Failed to create test users');
    }

    ownerUserId = ownerUser.id;
    normalUserId = normalUser.id;

    const [ownerRole] = await database.db
      .select({
        id: platformRoles.id,
      })
      .from(platformRoles)
      .where(eq(platformRoles.key, PLATFORM_OWNER_ROLE_KEY))
      .limit(1);

    if (!ownerRole) {
      throw new Error('Platform owner role is not initialized');
    }

    await database.db.insert(platformUserRoles).values({
      userId: ownerUserId,
      roleId: ownerRole.id,
    });
  });

  afterAll(async () => {
    if (database) {
      await database.db.delete(authSessions).where(eq(authSessions.userId, ownerUserId));

      await database.db.delete(authSessions).where(eq(authSessions.userId, normalUserId));

      await database.db.delete(users).where(eq(users.id, ownerUserId));

      await database.db.delete(users).where(eq(users.id, normalUserId));
    }

    if (app) {
      await app.close();
    }
  });

  it('returns 401 for a protected route without a session', async () => {
    await request(app.getHttpServer()).get('/api/admin/modules').expect(401);
  });

  it('returns 403 for a valid user without the required capability', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: normalLoginName,
        password: normalPassword,
      })
      .expect(200);

    await agent.get('/api/admin/modules').expect(403);
  });

  it('allows the platform owner to access a protected route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: ownerLoginName,
        password: ownerPassword,
      })
      .expect(200);

    await agent
      .get('/api/auth/me')
      .expect(200)
      .expect((response) => {
        expect(response.body.loginName).toBe(ownerLoginName);
      });

    await agent.get('/api/admin/modules').expect(200);
  });

  it('invalidates the session after logout', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: ownerLoginName,
        password: ownerPassword,
      })
      .expect(200);

    await agent.get('/api/auth/me').expect(200);

    await agent.post('/api/auth/logout').expect(200);

    await agent.get('/api/auth/me').expect(401);
  });
});
