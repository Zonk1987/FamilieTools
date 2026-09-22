import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { DatabaseService } from '../database/database.service.js';
import {
  authSessions,
  families,
  familyMemberships,
  platformRoles,
  platformUserRoles,
  users,
} from '../database/schema/index.js';
import { PLATFORM_OWNER_ROLE_KEY } from '../platform-auth/platform-capabilities.js';
import { PasswordService } from '../users/password.service.js';

function normalizeLoginName(value: string): string {
  return value.trim().toLowerCase();
}

async function promptPassword(message: string): Promise<string> {
  if (!input.isTTY) {
    throw new Error('Password input requires an interactive terminal.');
  }

  output.write(message);

  input.setRawMode(true);
  input.resume();
  input.setEncoding('utf8');

  return new Promise<string>((resolve, reject) => {
    let password = '';

    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      output.write('\n');
    };

    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(password);
          return;
        }

        if (character === '\u0003') {
          cleanup();
          reject(new Error('Recovery cancelled.'));
          return;
        }

        if (character === '\u007f' || character === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
          }

          continue;
        }

        password += character;
      }
    };

    input.on('data', onData);
  });
}

async function main() {
  const database = new DatabaseService();

  const passwordService = new PasswordService();

  const readline = createInterface({
    input,
    output,
  });

  try {
    const owners = await database.db
      .select({
        id: users.id,
        loginName: users.loginName,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(platformUserRoles)
      .innerJoin(platformRoles, eq(platformUserRoles.roleId, platformRoles.id))
      .innerJoin(users, eq(platformUserRoles.userId, users.id))
      .where(eq(platformRoles.key, PLATFORM_OWNER_ROLE_KEY));

    if (owners.length === 0) {
      throw new Error('No Platform Owner was found.');
    }

    let owner = owners[0];

    if (owners.length > 1) {
      console.log('');
      console.log('More than one Platform Owner exists:');
      console.log('');

      for (let index = 0; index < owners.length; index += 1) {
        const candidate = owners[index];

        if (!candidate) {
          continue;
        }

        const memberships = await database.db
          .select({
            familyId: families.id,
            familyName: families.name,
          })
          .from(familyMemberships)
          .innerJoin(families, eq(familyMemberships.familyId, families.id))
          .where(eq(familyMemberships.userId, candidate.id));

        console.log(`${index + 1}) ${candidate.displayName}`);
        console.log(`   User ID:  ${candidate.id}`);
        console.log(`   Login:    ${candidate.loginName}`);
        console.log(`   Created:  ${candidate.createdAt.toISOString()}`);

        if (memberships.length === 0) {
          console.log('   Families: none');
        } else {
          console.log('   Families:');

          for (const membership of memberships) {
            console.log(`     - ${membership.familyName} (${membership.familyId})`);
          }
        }

        console.log('');
      }

      const selection = await readline.question(`Select Platform Owner [1-${owners.length}]: `);

      const selectedIndex = Number(selection) - 1;

      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= owners.length) {
        throw new Error('Invalid Platform Owner selection.');
      }

      owner = owners[selectedIndex];
    }

    if (!owner) {
      throw new Error('Platform Owner could not be resolved.');
    }

    console.log('');
    console.log('FamilieTools Platform Owner Recovery');
    console.log('-----------------------------------');
    console.log(`User ID:      ${owner.id}`);
    console.log(`Display name: ${owner.displayName}`);
    console.log(`Current login: ${owner.loginName}`);
    console.log('');

    const enteredLoginName = await readline.question('New login name: ');

    const loginName = normalizeLoginName(enteredLoginName);

    if (!loginName) {
      throw new Error('Login name must not be empty.');
    }

    if (loginName.length > 64) {
      throw new Error('Login name must not exceed 64 characters.');
    }

    readline.pause();

    const password = await promptPassword('New password: ');

    const confirmation = await promptPassword('Confirm password: ');

    if (password !== confirmation) {
      throw new Error('Passwords do not match.');
    }

    if (password.length < 12) {
      throw new Error('Password must contain at least 12 characters.');
    }

    if (password.length > 200) {
      throw new Error('Password must not exceed 200 characters.');
    }

    const existingLogin = await database.db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.loginName, loginName))
      .limit(1);

    if (existingLogin[0] && existingLogin[0].id !== owner.id) {
      throw new Error('The requested login name is already in use.');
    }

    const passwordHash = await passwordService.hash(password);

    await database.transaction(async (transaction) => {
      await transaction
        .update(users)
        .set({
          loginName,
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, owner.id));

      await transaction.delete(authSessions).where(eq(authSessions.userId, owner.id));
    });

    console.log('');
    console.log('Platform Owner credentials updated successfully.');
    console.log(`Login name: ${loginName}`);
    console.log('All existing sessions for this account were revoked.');
  } finally {
    readline.close();

    await database.onApplicationShutdown();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error('');
  console.error(`Recovery failed: ${message}`);

  process.exitCode = 1;
});
