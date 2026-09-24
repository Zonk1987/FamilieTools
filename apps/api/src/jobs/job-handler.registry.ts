import { Injectable } from '@nestjs/common';

import type { JobHandler } from './job-handler.types.js';

@Injectable()
export class JobHandlerRegistry {
  private readonly handlers = new Map<string, JobHandler>();

  register(key: string, handler: JobHandler): void {
    this.validateKey(key);

    if (typeof handler !== 'function') {
      throw new Error('Job handler must be a function');
    }

    if (this.handlers.has(key)) {
      throw new Error(`Job handler "${key}" is already registered`);
    }

    this.handlers.set(key, handler);
  }

  has(key: string): boolean {
    return this.handlers.has(key);
  }

  get(key: string): JobHandler {
    const handler = this.handlers.get(key);

    if (!handler) {
      throw new Error(`Job handler "${key}" is not registered`);
    }

    return handler;
  }

  listKeys(): string[] {
    return [...this.handlers.keys()].sort((a, b) => a.localeCompare(b));
  }

  private validateKey(key: string): void {
    if (key.length === 0 || key.trim() !== key) {
      throw new Error('Job handler key must not be empty or contain surrounding whitespace');
    }

    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(key)) {
      throw new Error(`Invalid job handler key "${key}"`);
    }
  }
}
