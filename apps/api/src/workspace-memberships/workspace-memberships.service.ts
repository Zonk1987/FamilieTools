import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { WorkspaceMembership } from '../database/schema/index.js';
import { UsersService } from '../users/users.service.js';
import { WorkspacesRepository } from '../workspaces/workspaces.repository.js';
import { WorkspaceMembershipsRepository } from './workspace-memberships.repository.js';

@Injectable()
export class WorkspaceMembershipsService {
  constructor(
    private readonly workspaceMembershipsRepository: WorkspaceMembershipsRepository,
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  async addUserToWorkspace(workspaceId: string, userId: string): Promise<WorkspaceMembership> {
    return this.databaseService.transaction(async (tx) => {
      const workspace = await this.workspacesRepository.findById(workspaceId, tx);

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const user = await this.usersService.findUserById(userId, tx);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existing = await this.workspaceMembershipsRepository.findByWorkspaceAndUser(
        workspaceId,
        userId,
        tx,
      );

      if (existing) {
        return existing;
      }

      const created = await this.workspaceMembershipsRepository.createIfAbsent(
        {
          workspaceId,
          userId,
        },
        tx,
      );

      if (created) {
        return created;
      }

      const concurrentMembership = await this.workspaceMembershipsRepository.findByWorkspaceAndUser(
        workspaceId,
        userId,
        tx,
      );

      if (!concurrentMembership) {
        throw new Error('Workspace membership could not be created or loaded');
      }

      return concurrentMembership;
    });
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMembership[]> {
    const workspace = await this.workspacesRepository.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.workspaceMembershipsRepository.findByWorkspace(workspaceId);
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMembership[]> {
    return this.workspaceMembershipsRepository.findByUser(userId);
  }

  async removeUserFromWorkspace(workspaceId: string, userId: string): Promise<void> {
    const deleted = await this.workspaceMembershipsRepository.delete(workspaceId, userId);

    if (!deleted) {
      throw new NotFoundException('Workspace membership not found');
    }
  }
}
