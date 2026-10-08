import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';
import { DatabaseService } from '../database/database.service.js';
import { users, workspaceMemberships, workspaces } from '../database/schema/index.js';
import { WorkspaceMembershipsService } from '../workspace-memberships/workspace-memberships.service.js';
import { WorkspacesService } from './workspaces.service.js';

describe('Workspaces integration', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let workspacesService: WorkspacesService;
  let workspaceMembershipsService: WorkspaceMembershipsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    database = app.get(DatabaseService);
    workspacesService = app.get(WorkspacesService);
    workspaceMembershipsService = app.get(WorkspaceMembershipsService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createTestUser() {
    const suffix = randomUUID();

    const [user] = await database.db
      .insert(users)
      .values({
        loginName: `workspace-test-${suffix}`,
        displayName: 'Workspace Integration Test',
        passwordHash: 'integration-test-password-hash',
      })
      .returning();

    if (!user) {
      throw new Error('Failed to create test user');
    }

    return user;
  }

  it('creates and stores a normalized workspace', async () => {
    const suffix = randomUUID();

    const workspace = await workspacesService.createWorkspace({
      name: ' Integration Workspace ',
      slug: ` Integration ${suffix} `,
      description: ' Integration test workspace ',
    });

    expect(workspace).toEqual(
      expect.objectContaining({
        name: 'Integration Workspace',
        slug: `integration-${suffix}`,
        description: 'Integration test workspace',
        isActive: true,
      }),
    );

    const [stored] = await database.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace.id))
      .limit(1);

    expect(stored).toEqual(
      expect.objectContaining({
        id: workspace.id,
        slug: workspace.slug,
      }),
    );

    await database.db.delete(workspaces).where(eq(workspaces.id, workspace.id));
  });

  it('enforces unique workspace slugs in PostgreSQL', async () => {
    const slug = `duplicate-${randomUUID()}`;

    const [first] = await database.db
      .insert(workspaces)
      .values({
        name: 'First Workspace',
        slug,
      })
      .returning();

    if (!first) {
      throw new Error('Failed to create first workspace');
    }

    await expect(
      database.db.insert(workspaces).values({
        name: 'Second Workspace',
        slug,
      }),
    ).rejects.toThrow();

    await database.db.delete(workspaces).where(eq(workspaces.id, first.id));
  });

  it('handles concurrent workspace creation with the same slug', async () => {
    const slug = `concurrent-${randomUUID()}`;

    const results = await Promise.allSettled([
      workspacesService.createWorkspace({
        name: 'Concurrent Workspace A',
        slug,
      }),
      workspacesService.createWorkspace({
        name: 'Concurrent Workspace B',
        slug,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');

    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    if (rejected[0]?.status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    }

    const stored = await database.db.select().from(workspaces).where(eq(workspaces.slug, slug));

    expect(stored).toHaveLength(1);

    await database.db.delete(workspaces).where(eq(workspaces.slug, slug));
  });

  it('creates a workspace membership', async () => {
    const user = await createTestUser();

    const workspace = await workspacesService.createWorkspace({
      name: 'Membership Workspace',
      slug: `membership-${randomUUID()}`,
    });

    const membership = await workspaceMembershipsService.addUserToWorkspace(workspace.id, user.id);

    expect(membership).toEqual(
      expect.objectContaining({
        workspaceId: workspace.id,
        userId: user.id,
      }),
    );

    const stored = await database.db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.id, membership.id));

    expect(stored).toHaveLength(1);

    await database.db.delete(workspaces).where(eq(workspaces.id, workspace.id));

    await database.db.delete(users).where(eq(users.id, user.id));
  });

  it('returns one membership for concurrent duplicate additions', async () => {
    const user = await createTestUser();

    const workspace = await workspacesService.createWorkspace({
      name: 'Concurrent Membership Workspace',
      slug: `membership-race-${randomUUID()}`,
    });

    const [first, second] = await Promise.all([
      workspaceMembershipsService.addUserToWorkspace(workspace.id, user.id),
      workspaceMembershipsService.addUserToWorkspace(workspace.id, user.id),
    ]);

    expect(first.id).toBe(second.id);

    const stored = await database.db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.workspaceId, workspace.id));

    const matching = stored.filter((membership) => membership.userId === user.id);

    expect(matching).toHaveLength(1);

    await database.db.delete(workspaces).where(eq(workspaces.id, workspace.id));

    await database.db.delete(users).where(eq(users.id, user.id));
  });

  it('deletes workspace memberships when the workspace is deleted', async () => {
    const user = await createTestUser();

    const workspace = await workspacesService.createWorkspace({
      name: 'Cascade Workspace',
      slug: `cascade-${randomUUID()}`,
    });

    const membership = await workspaceMembershipsService.addUserToWorkspace(workspace.id, user.id);

    await database.db.delete(workspaces).where(eq(workspaces.id, workspace.id));

    const storedMembership = await database.db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.id, membership.id));

    expect(storedMembership).toHaveLength(0);

    await database.db.delete(users).where(eq(users.id, user.id));
  });

  it('rejects memberships referencing a missing workspace', async () => {
    const user = await createTestUser();

    await expect(
      database.db.insert(workspaceMemberships).values({
        workspaceId: '99999999-9999-4999-8999-999999999999',
        userId: user.id,
      }),
    ).rejects.toThrow();

    await database.db.delete(users).where(eq(users.id, user.id));
  });
});
