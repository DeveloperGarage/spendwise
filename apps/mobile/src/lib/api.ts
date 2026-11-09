const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type Me = {
  id: string;
  displayName: string;
  email: string;
  profileCompleted: boolean;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
  ) {
    super(code ?? `HTTP ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: { code?: string } }
    | null;
  if (!response.ok) {
    const code = body && typeof body === 'object' && 'error' in body ? body.error?.code : undefined;
    throw new ApiError(response.status, code);
  }
  return body as T;
}

export function getMe(): Promise<Me> {
  return request<Me>('/me');
}

export function patchMe(displayName: string): Promise<Me> {
  return request<Me>('/me', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
}

export function startGoogleSignIn() {
  if (typeof window === 'undefined') return;
  window.location.assign(`${API_URL}/auth/google`);
}
