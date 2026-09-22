import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

export async function load({ request }: { request: Request }) {
  const apiBaseUrl = env.API_BASE_URL ?? 'http://localhost:3000';

  const cookie = request.headers.get('cookie');

  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: cookie
      ? {
          cookie,
        }
      : {},
  });

  if (response.status === 401) {
    redirect(303, '/login');
  }

  if (!response.ok) {
    error(502, 'Unable to verify the current session');
  }

  const user = await response.json();

  return {
    user,
  };
}
