import { apiClient } from '$lib/api/client';

export type AuthUser = {
  id: string;
  loginName: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

type LoginResponse = {
  user: AuthUser;
  expiresAt: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, response } = await apiClient.GET('/api/auth/me');

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load the current user');
  }

  return data as unknown as AuthUser;
}

export async function login(loginName: string, password: string): Promise<AuthUser> {
  const { data, response } = await apiClient.POST('/api/auth/login', {
    body: {
      loginName,
      password,
    },
  });

  if (response.status === 401) {
    throw new Error('Invalid login credentials');
  }

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const result = data as unknown as LoginResponse;

  return result.user;
}

export async function logout(): Promise<void> {
  const { response } = await apiClient.POST('/api/auth/logout');

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}
