import type { Warehouse, VehicleRecord, BackendVehicleStatus } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  companyId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  companyId?: string;
  role?: string;
  phone?: string;
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
  lat: number;
  lng: number;
  isActive?: boolean;
}

export interface CreateVehiclePayload {
  plate: string;
  name?: string;
  capacityKg: number;
  status?: BackendVehicleStatus;
  driverId?: string;
}

// Token storage helpers
export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem('rf_auth_token') || localStorage.getItem('routeflow_token');
  },
  set: (token: string) => {
    localStorage.setItem('rf_auth_token', token);
    localStorage.setItem('routeflow_token', token);
  },
  remove: () => {
    localStorage.removeItem('rf_auth_token');
    localStorage.removeItem('routeflow_token');
    localStorage.removeItem('routeflow_user');
  },
};

// Generic lightweight fetch client
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// 1. Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    tokenStorage.set(data.accessToken);
    localStorage.setItem('routeflow_user', JSON.stringify(data.user));
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    tokenStorage.set(data.accessToken);
    localStorage.setItem('routeflow_user', JSON.stringify(data.user));
    return data;
  },

  getProfile: async (): Promise<AuthUser | null> => {
    const token = tokenStorage.get();
    if (!token) return null;
    try {
      const data = await request<{ user: AuthUser } | AuthUser>('/auth/me');
      return (data as any).user || data;
    } catch {
      tokenStorage.remove();
      return null;
    }
  },

  logout: () => {
    tokenStorage.remove();
  },
};

// 2. Warehouses API
export const warehousesApi = {
  getAll: (): Promise<Warehouse[]> => {
    return request<Warehouse[]>('/warehouses');
  },

  getOne: (id: string): Promise<Warehouse> => {
    return request<Warehouse>(`/warehouses/${id}`);
  },

  create: (data: CreateWarehousePayload): Promise<Warehouse> => {
    return request<Warehouse>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: Partial<CreateWarehousePayload>): Promise<Warehouse> => {
    return request<Warehouse>(`/warehouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<{ deleted: boolean; id: string }> => {
    return request<{ deleted: boolean; id: string }>(`/warehouses/${id}`, {
      method: 'DELETE',
    });
  },
};

// 3. Vehicles API
export const vehiclesApi = {
  getAll: (): Promise<VehicleRecord[]> => {
    return request<VehicleRecord[]>('/vehicles');
  },

  getOne: (id: string): Promise<VehicleRecord> => {
    return request<VehicleRecord>(`/vehicles/${id}`);
  },

  create: (data: CreateVehiclePayload): Promise<VehicleRecord> => {
    return request<VehicleRecord>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: Partial<CreateVehiclePayload>): Promise<VehicleRecord> => {
    return request<VehicleRecord>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: string): Promise<{ deleted: boolean; id: string }> => {
    return request<{ deleted: boolean; id: string }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};

