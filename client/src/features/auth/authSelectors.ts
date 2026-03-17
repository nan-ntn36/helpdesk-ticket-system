import type { RootState } from '@/app/store';

export const selectUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsInitializing = (state: RootState) => state.auth.isInitializing;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUserRole = (state: RootState) => state.auth.user?.role ?? null;
export const selectUserPermissions = (state: RootState) => state.auth.user?.permissions ?? [];
