const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface BackendAuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  companyId: string;
}

export interface BackendAuthResponse {
  accessToken: string;
  user: BackendAuthUser;
}

export const authStorage = {
  getToken: (): string | null => localStorage.getItem('routeflow_token'),
  getUser: (): BackendAuthUser | null => {
    const raw = localStorage.getItem('routeflow_user');
    return raw ? JSON.parse(raw) : null;
  },
  saveSession: (data: BackendAuthResponse) => {
    localStorage.setItem('routeflow_token', data.accessToken);
    localStorage.setItem('routeflow_user', JSON.stringify(data.user));
  },
  clearSession: () => {
    localStorage.removeItem('routeflow_token');
    localStorage.removeItem('routeflow_user');
  },
};

export async function loginApi(email: string, password: string): Promise<BackendAuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  authStorage.saveSession(data);
  return data;
}

export async function registerApi(payload: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  role?: string;
  phone?: string;
}): Promise<BackendAuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear la cuenta');
  }

  authStorage.saveSession(data);
  return data;
}

export async function fetchProfileApi(): Promise<any> {
  const token = authStorage.getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    authStorage.clearSession();
    return null;
  }

  return response.json();
}

