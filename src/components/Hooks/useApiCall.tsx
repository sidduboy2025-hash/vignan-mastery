import { useState, useCallback } from 'react';

interface UseApiCallReturn<T = any> {
  loading: boolean;
  error: string | null;
  data: T | null;
  makeApiCall: (apiFunction: () => Promise<T>, options?: { showLoader?: boolean }) => Promise<T>;
  resetError: () => void;
}

export const useApiCall = <T = any>(): UseApiCallReturn<T> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const makeApiCall = useCallback(async (
    apiFunction: () => Promise<T>,
    options: { showLoader?: boolean } = { showLoader: true }
  ): Promise<T> => {
    if (options.showLoader) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      if (options.showLoader) {
        setLoading(false);
      }
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, data, makeApiCall, resetError };
};
