import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceMembershipsService } from './workspace-memberships.service.js';

function createWorkspace() {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'home',
    name: 'Home',
    description: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createUser() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    loginName: 'sebastian',
    displayName: 'Sebastian',
    passwordHash: 'hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createMembership(overrides = {}) {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    workspaceId: '22222222-2222-4222-8222-222222222222',
    userId: '11111111-1111-4111-8111-111111111111',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createDependencies() {
  const tx = {
    id: 'transaction',
  };

  const workspaceMembershipsRepository = {
    createIfAbsent: vi.fn(),
    findByWorkspaceAndUser: vi.fn(),
    findByWorkspace: vi.fn(),
    findByUser: vi.fn(),
    delete: vi.fn(),
  };

  const workspacesRepository = {
    findById: vi.fn(),
  };

  const usersService = {
    findUserById: vi.fn(),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    transaction,
  };

  const service = new WorkspaceMembershipsService(
    workspaceMembershipsRepository as never,
    workspacesRepository as never,
    usersService as never,
    databaseService as never,
  );

  return {
    service,
    tx,
    transaction,
    workspaceMembershipsRepository,
    workspacesRepository,
    usersService,
  };
}

describe('WorkspaceMembershipsService', () => {
  it('creates a workspace membership when none exists', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();
    const user = createUser();
    const membership = createMembership();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.usersService.findUserById.mockResolvedValue(user);

    dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser.mockResolvedValue(null);

    dependencies.workspaceMembershipsRepository.createIfAbsent.mockResolvedValue(membership);

    const result = await dependencies.service.addUserToWorkspace(workspace.id, user.id);

    expect(dependencies.workspacesRepository.findById).toHaveBeenCalledWith(
      workspace.id,
      dependencies.tx,
    );

    expect(dependencies.usersService.findUserById).toHaveBeenCalledWith(user.id, dependencies.tx);

    expect(dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser).toHaveBeenCalledWith(
      workspace.id,
      user.id,
      dependencies.tx,
    );

    expect(dependencies.workspaceMembershipsRepository.createIfAbsent).toHaveBeenCalledWith(
      {
        workspaceId: workspace.id,
        userId: user.id,
      },
      dependencies.tx,
    );

    expect(result).toEqual(membership);
  });

  it('returns an existing membership instead of creating a duplicate', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();
    const user = createUser();
    const membership = createMembership();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.usersService.findUserById.mockResolvedValue(user);

    dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser.mockResolvedValue(
      membership,
    );

    const result = await dependencies.service.addUserToWorkspace(workspace.id, user.id);

    expect(dependencies.workspaceMembershipsRepository.createIfAbsent).not.toHaveBeenCalled();

    expect(result).toEqual(membership);
  });

  it('rejects adding a user to an unknown workspace', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findById.mockResolvedValue(null);

    await expect(
      dependencies.service.addUserToWorkspace(
        'missing-workspace',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(dependencies.usersService.findUserById).not.toHaveBeenCalled();

    expect(dependencies.workspaceMembershipsRepository.createIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects adding an unknown user to a workspace', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.usersService.findUserById.mockResolvedValue(null);

    await expect(
      dependencies.service.addUserToWorkspace(workspace.id, 'missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(dependencies.workspaceMembershipsRepository.createIfAbsent).not.toHaveBeenCalled();
  });

  it('lists memberships for a workspace', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();
    const memberships = [
      createMembership(),
      createMembership({
        id: '44444444-4444-4444-8444-444444444444',
        userId: '55555555-5555-4555-8555-555555555555',
      }),
    ];

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspaceMembershipsRepository.findByWorkspace.mockResolvedValue(memberships);

    const result = await dependencies.service.getWorkspaceMembers(workspace.id);

    expect(dependencies.workspaceMembershipsRepository.findByWorkspace).toHaveBeenCalledWith(
      workspace.id,
    );

    expect(result).toEqual(memberships);
  });

  it('rejects listing members for an unknown workspace', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findById.mockResolvedValue(null);

    await expect(
      dependencies.service.getWorkspaceMembers('missing-workspace'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(dependencies.workspaceMembershipsRepository.findByWorkspace).not.toHaveBeenCalled();
  });

  it('lists workspace memberships for a user', async () => {
    const dependencies = createDependencies();

    const userId = '11111111-1111-4111-8111-111111111111';

    const memberships = [createMembership()];

    dependencies.workspaceMembershipsRepository.findByUser.mockResolvedValue(memberships);

    const result = await dependencies.service.getUserWorkspaces(userId);

    expect(dependencies.workspaceMembershipsRepository.findByUser).toHaveBeenCalledWith(userId);

    expect(result).toEqual(memberships);
  });

  it('removes an existing workspace membership', async () => {
    const dependencies = createDependencies();

    const membership = createMembership();

    dependencies.workspaceMembershipsRepository.delete.mockResolvedValue(true);

    await expect(
      dependencies.service.removeUserFromWorkspace(membership.workspaceId, membership.userId),
    ).resolves.toBeUndefined();

    expect(dependencies.workspaceMembershipsRepository.delete).toHaveBeenCalledWith(
      membership.workspaceId,
      membership.userId,
    );
  });

  it('throws when removing an unknown workspace membership', async () => {
    const dependencies = createDependencies();

    dependencies.workspaceMembershipsRepository.delete.mockResolvedValue(false);

    await expect(
      dependencies.service.removeUserFromWorkspace(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a concurrently created membership when insert loses the race', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();
    const user = createUser();
    const membership = createMembership();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.usersService.findUserById.mockResolvedValue(user);

    dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(membership);

    dependencies.workspaceMembershipsRepository.createIfAbsent.mockResolvedValue(null);

    const result = await dependencies.service.addUserToWorkspace(workspace.id, user.id);

    expect(dependencies.workspaceMembershipsRepository.createIfAbsent).toHaveBeenCalledWith(
      {
        workspaceId: workspace.id,
        userId: user.id,
      },
      dependencies.tx,
    );

    expect(
      dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser,
    ).toHaveBeenCalledTimes(2);

    expect(result).toEqual(membership);
  });

  it('throws when a membership could neither be created nor loaded', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();
    const user = createUser();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.usersService.findUserById.mockResolvedValue(user);

    dependencies.workspaceMembershipsRepository.findByWorkspaceAndUser.mockResolvedValue(null);

    dependencies.workspaceMembershipsRepository.createIfAbsent.mockResolvedValue(null);

    await expect(dependencies.service.addUserToWorkspace(workspace.id, user.id)).rejects.toThrow(
      'Workspace membership could not be created or loaded',
    );
  });
});
