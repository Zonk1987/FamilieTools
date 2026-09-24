import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';
import { DatabaseService } from '../database/database.service.js';
import { auditLogs, platformRoles, platformUserRoles, users } from '../database/schema/index.js';
import { PLATFORM_OWNER_ROLE_KEY } from '../platform-auth/platform-capabilities.js';
import { PasswordService } from '../users/password.service.js';

describe('Audit integration', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let passwordService: PasswordService;

  const ownerLoginName = 'audit-owner-test';
  const ownerPassword = 'very-secure-audit-owner-password';

  const normalLoginName = 'audit-user-test';
  const normalPassword = 'very-secure-audit-user-password';

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
        displayName: 'Audit Owner Test',
        passwordHash: ownerPasswordHash,
      })
      .returning({
        id: users.id,
      });

    const [normalUser] = await database.db
      .insert(users)
      .values({
        loginName: normalLoginName,
        displayName: 'Audit User Test',
        passwordHash: normalPasswordHash,
      })
      .returning({
        id: users.id,
      });

    if (!ownerUser || !normalUser) {
      throw new Error('Failed to create audit test users');
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
      await database.db.delete(auditLogs).where(eq(auditLogs.actorId, ownerUserId));

      await database.db.delete(auditLogs).where(eq(auditLogs.actorId, normalUserId));

      await database.db.delete(users).where(eq(users.id, ownerUserId));

      await database.db.delete(users).where(eq(users.id, normalUserId));
    }

    if (app) {
      await app.close();
    }
  });

  it('returns 401 without a session', async () => {
    await request(app.getHttpServer()).get('/api/admin/audit').expect(401);
  });

  it('returns 403 for a user without platform.audit.read', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: normalLoginName,
        password: normalPassword,
      })
      .expect(200);

    await agent.get('/api/admin/audit').expect(403);
  });

  it('returns audit events for the platform owner', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: ownerLoginName,
        password: ownerPassword,
      })
      .expect(200);

    const response = await agent.get('/api/admin/audit').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        page: 1,
        pageSize: 25,
        total: expect.any(Number),
      }),
    );
  });

  it('supports pagination and audit filters', async () => {
    await database.db.delete(auditLogs).where(eq(auditLogs.action, 'test.audit.filtered'));

    await database.db.insert(auditLogs).values([
      {
        actorType: 'system',
        actorId: null,
        scopeType: 'platform',
        scopeId: null,
        action: 'test.audit.filtered',
        targetType: null,
        targetId: null,
        result: 'success',
        requestId: 'audit-filter-request-1',
        metadata: {
          source: 'integration-test',
        },
      },
      {
        actorType: 'system',
        actorId: null,
        scopeType: 'platform',
        scopeId: null,
        action: 'test.audit.filtered',
        targetType: null,
        targetId: null,
        result: 'failure',
        requestId: 'audit-filter-request-2',
        metadata: {
          source: 'integration-test',
        },
      },
    ]);

    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        loginName: ownerLoginName,
        password: ownerPassword,
      })
      .expect(200);

    const response = await agent
      .get('/api/admin/audit')
      .query({
        page: 1,
        pageSize: 10,
        action: 'test.audit.filtered',
        result: 'success',
        requestId: 'audit-filter-request-1',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        total: 1,
      }),
    );

    expect(response.body.items).toEqual([
      expect.objectContaining({
        actorType: 'system',
        scopeType: 'platform',
        action: 'test.audit.filtered',
        result: 'success',
        requestId: 'audit-filter-request-1',
        metadata: {
          source: 'integration-test',
        },
      }),
    ]);

    await database.db.delete(auditLogs).where(eq(auditLogs.action, 'test.audit.filtered'));
  });
});
