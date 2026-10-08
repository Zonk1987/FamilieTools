import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { WorkspacesService } from './workspaces.service.js';

function createWorkspace(overrides = {}) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'home',
    name: 'Home',
    description: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createDependencies() {
  const tx = {
    id: 'transaction',
  };

  const workspacesRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    transaction,
  };

  const service = new WorkspacesService(workspacesRepository as never, databaseService as never);

  return {
    service,
    tx,
    workspacesRepository,
    transaction,
  };
}

describe('WorkspacesService', () => {
  it('creates a normalized workspace', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(null);

    const createdWorkspace = createWorkspace({
      description: 'Private home workspace',
    });

    dependencies.workspacesRepository.create.mockResolvedValue(createdWorkspace);

    const result = await dependencies.service.createWorkspace({
      name: ' Home ',
      slug: ' My Home ',
      description: ' Private home workspace ',
    });

    expect(dependencies.workspacesRepository.findBySlug).toHaveBeenCalledWith(
      'my-home',
      dependencies.tx,
    );

    expect(dependencies.workspacesRepository.create).toHaveBeenCalledWith(
      {
        name: 'Home',
        slug: 'my-home',
        description: 'Private home workspace',
        isActive: true,
      },
      dependencies.tx,
    );

    expect(result).toEqual(createdWorkspace);
  });

  it('rejects an empty workspace name', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.service.createWorkspace({
        name: '   ',
        slug: 'home',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.workspacesRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a slug that becomes empty after normalization', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.service.createWorkspace({
        name: 'Home',
        slug: '--- !!! ---',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.workspacesRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate workspace slug', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(createWorkspace());

    await expect(
      dependencies.service.createWorkspace({
        name: 'Another Home',
        slug: 'HOME',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.workspacesRepository.create).not.toHaveBeenCalled();
  });

  it('returns a workspace by id', async () => {
    const dependencies = createDependencies();
    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    const result = await dependencies.service.getWorkspaceById(workspace.id);

    expect(result).toEqual(workspace);
  });

  it('throws when a workspace does not exist', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findById.mockResolvedValue(null);

    await expect(dependencies.service.getWorkspaceById('missing-workspace')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates and normalizes workspace values', async () => {
    const dependencies = createDependencies();
    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(null);

    dependencies.workspacesRepository.update.mockResolvedValue({
      ...workspace,
      name: 'Private Home',
      slug: 'private-home',
      description: 'Main workspace',
      isActive: false,
    });

    const result = await dependencies.service.updateWorkspace(workspace.id, {
      name: ' Private Home ',
      slug: ' Private Home ',
      description: ' Main workspace ',
      isActive: false,
    });

    expect(dependencies.workspacesRepository.update).toHaveBeenCalledWith(
      workspace.id,
      {
        name: 'Private Home',
        slug: 'private-home',
        description: 'Main workspace',
        isActive: false,
      },
      dependencies.tx,
    );

    expect(result.slug).toBe('private-home');
    expect(result.isActive).toBe(false);
  });

  it('rejects changing a slug to one used by another workspace', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(
      createWorkspace({
        id: '33333333-3333-4333-8333-333333333333',
        slug: 'company',
      }),
    );

    await expect(
      dependencies.service.updateWorkspace(workspace.id, {
        slug: 'company',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.workspacesRepository.update).not.toHaveBeenCalled();
  });

  it('allows keeping the workspace own slug', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(workspace);

    dependencies.workspacesRepository.update.mockResolvedValue({
      ...workspace,
      name: 'Updated Home',
    });

    await expect(
      dependencies.service.updateWorkspace(workspace.id, {
        name: 'Updated Home',
        slug: 'home',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'Updated Home',
        slug: 'home',
      }),
    );
  });

  it('deletes an existing workspace', async () => {
    const dependencies = createDependencies();
    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspacesRepository.delete.mockResolvedValue(true);

    await expect(dependencies.service.deleteWorkspace(workspace.id)).resolves.toBeUndefined();

    expect(dependencies.workspacesRepository.delete).toHaveBeenCalledWith(
      workspace.id,
      dependencies.tx,
    );
  });

  it('rejects deleting an unknown workspace', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findById.mockResolvedValue(null);

    await expect(dependencies.service.deleteWorkspace('missing-workspace')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(dependencies.workspacesRepository.delete).not.toHaveBeenCalled();
  });

  it('converts a concurrent duplicate create into a conflict', async () => {
    const dependencies = createDependencies();

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(null);

    dependencies.workspacesRepository.create.mockRejectedValue({
      code: '23505',
    });

    await expect(
      dependencies.service.createWorkspace({
        name: 'Home',
        slug: 'home',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent duplicate slug update into a conflict', async () => {
    const dependencies = createDependencies();

    const workspace = createWorkspace();

    dependencies.workspacesRepository.findById.mockResolvedValue(workspace);

    dependencies.workspacesRepository.findBySlug.mockResolvedValue(null);

    dependencies.workspacesRepository.update.mockRejectedValue({
      code: '23505',
    });

    await expect(
      dependencies.service.updateWorkspace(workspace.id, {
        slug: 'company',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
