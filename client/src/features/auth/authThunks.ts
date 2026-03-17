import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, type LoginRequest } from '@/api/auth.api';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  success: boolean;
  message: string;
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data.data; // { accessToken, user }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authApi.logout();
    } catch {
      // Silent fail — clear state regardless
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.me();
      return response.data.data.user;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch user'
      );
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refresh();
      return response.data.data.accessToken;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Session expired'
      );
    }
  }
);
