import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { ApiResponse } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
}

export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiFunction(...args);
        
        if (response.success && response.data) {
          setState(prev => ({ ...prev, data: response.data as T, loading: false }));
          return response.data;
        } else {
          const errorMessage = response.message || 'Operation failed';
          setState(prev => ({ ...prev, error: errorMessage, loading: false }));
          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

export function useLogin() {
  return useApi(apiService.login as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useRegister() {
  return useApi(apiService.register as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useGetCurrentUser() {
  return useApi(apiService.getCurrentUser as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useGetTrainers() {
  // Bind method to preserve ApiService `this` context
  return useApi((...args: unknown[]) => apiService.getTrainers(args[0] as string | undefined) as unknown as Promise<ApiResponse<any>>);
}

export function useGetTrainer() {
  return useApi((...args: unknown[]) => apiService.getTrainer(args[0] as string) as unknown as Promise<ApiResponse<any>>);
}

export function useCreateTrainer() {
  return useApi(apiService.createTrainer as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useUpdateTrainer() {
  return useApi(apiService.updateTrainer as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useDeleteTrainer() {
  return useApi(apiService.deleteTrainer as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useGetApiKeys() {
  return useApi(apiService.getApiKeys as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useCreateApiKey() {
  return useApi(apiService.createApiKey as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useUpdateApiKey() {
  return useApi(apiService.updateApiKey as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useDeleteApiKey() {
  return useApi(apiService.deleteApiKey as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useGetSessions() {
  return useApi(apiService.getSessions as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useCreateSession() {
  return useApi(apiService.createSession as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}

export function useGetAnalytics() {
  return useApi(apiService.getAnalytics as (...args: unknown[]) => Promise<ApiResponse<unknown>>);
}
