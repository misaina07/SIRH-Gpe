const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('sirh_access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur API (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> { return request<T>(path); }
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}
export async function apiDelete<T = void>(path: string): Promise<T> {
  const token = sessionStorage.getItem('sirh_access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur API (${response.status})`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0' || !response.headers.get('content-type')?.includes('application/json')) return undefined as T;
  return response.json() as Promise<T>;
}
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = sessionStorage.getItem('sirh_access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur API (${response.status})`);
  }
  return response.json() as Promise<T>;
}
export async function apiBlob(path: string): Promise<Blob> {
  const token = sessionStorage.getItem('sirh_access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur API (${response.status})`);
  }
  return response.blob();
}
