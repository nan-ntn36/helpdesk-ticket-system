import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────
// Dynamically import store to avoid circular dependency
let getStore: (() => typeof import('@/app/store').store) | null = null;

export function setupInterceptors(storeGetter: typeof getStore) {
  getStore = storeGetter;
}

api.interceptors.request.use((config) => {
  if (getStore) {
    const token = getStore().getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and not already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for auth endpoints themselves
    if (originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh endpoint directly (not through thunk to avoid circular dep)
      const response = await api.post('/auth/refresh');
      const { accessToken } = response.data.data;

      // Update Redux store
      if (getStore) {
        const { setAccessToken } = await import('@/features/auth/authSlice');
        getStore().dispatch(setAccessToken(accessToken));
      }

      processQueue(null);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      // Refresh failed → clear auth state and redirect
      if (getStore) {
        const { clearAuth } = await import('@/features/auth/authSlice');
        getStore().dispatch(clearAuth());
      }
      window.location.href = '/auth/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
