import { describe, expect, it, vi } from 'vitest';

import type { FamilyMembership } from './family-memberships.repository.js';
import { FamilyMembershipsRepository } from './family-memberships.repository.js';
import { FamilyMembershipsService } from './family-memberships.service.js';

describe('FamilyMembershipsService', () => {
  it('creates a new membership when none exists', async () => {
    const createdMembership: FamilyMembership = {
      id: '33333333-3333-3333-3333-333333333333',
      familyId: '22222222-2222-2222-2222-222222222222',
      userId: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const findByFamilyAndUser = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue(createdMembership);

    const repository = {
      findByFamilyAndUser,
      create,
    } as unknown as FamilyMembershipsRepository;

    const service = new FamilyMembershipsService(repository);

    const result = await service.addUserToFamily(
      createdMembership.familyId,
      createdMembership.userId,
    );

    expect(findByFamilyAndUser).toHaveBeenCalledWith(
      createdMembership.familyId,
      createdMembership.userId,
    );

    expect(create).toHaveBeenCalledWith({
      familyId: createdMembership.familyId,
      userId: createdMembership.userId,
    });

    expect(result).toEqual(createdMembership);
  });

  it('returns the existing membership instead of creating a duplicate', async () => {
    const existingMembership: FamilyMembership = {
      id: '33333333-3333-3333-3333-333333333333',
      familyId: '22222222-2222-2222-2222-222222222222',
      userId: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const findByFamilyAndUser = vi.fn().mockResolvedValue(existingMembership);
    const create = vi.fn();

    const repository = {
      findByFamilyAndUser,
      create,
    } as unknown as FamilyMembershipsRepository;

    const service = new FamilyMembershipsService(repository);

    const result = await service.addUserToFamily(
      existingMembership.familyId,
      existingMembership.userId,
    );

    expect(create).not.toHaveBeenCalled();
    expect(result).toEqual(existingMembership);
  });
});
