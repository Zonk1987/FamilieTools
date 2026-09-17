import createClient from 'openapi-fetch';

import type { paths } from './schema';

const baseUrl =
  typeof window === 'undefined' ? (process.env.API_BASE_URL ?? 'http://localhost:3000') : '';

export const apiClient = createClient<paths>({
  baseUrl,
});
