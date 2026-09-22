import type { ApiError } from '@/types/api.types';

export interface NormalizedError {
  message: string;
  errors: ApiError[];
  status: number | null;
  isNetworkError: boolean;
}

export function normalizeError(error: unknown): NormalizedError {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: ApiError[] }
      | undefined;

    return {
      message: data?.message ?? error.message ?? 'An unexpected error occurred',
      errors: data?.errors ?? [],
      status: error.response?.status ?? null,
      isNetworkError: !error.response,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      errors: [],
      status: null,
      isNetworkError: false,
    };
  }

  return {
    message: 'An unexpected error occurred',
    errors: [],
    status: null,
    isNetworkError: false,
  };
}

interface AxiosLikeError {
  isAxiosError: true;
  message: string;
  response?: {
    status: number;
    data: unknown;
  };
}

function isAxiosError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosLikeError).isAxiosError === true
  );
}
