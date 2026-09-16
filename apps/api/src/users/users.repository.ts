import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../database/database.service.js';
import { users } from '../database/schema/users.js';

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewUser): Promise<User> {
    const [user] = await this.databaseService.db.insert(users).values(data).returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }
}
