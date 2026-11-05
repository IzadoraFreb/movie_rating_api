'use client';
import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react';
import { api, message, getRevision, subscribeToMutations } from './api';
export function useResource<T>(path: string | null) {
  const [version, reload] = useReducer((value: number) => value + 1, 0);
  const revision = useSyncExternalStore(
    subscribeToMutations,
    getRevision,
    () => 0,
  );
  const key = path + ':' + version + ':' + revision;
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>(
    { key: '' },
  );
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => setState({ key, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({ key, error: message(error) });
      });
    return () => controller.abort();
  }, [path, key]);
  return {
    data: path && state.key === key ? state.data : undefined,
    error: path && state.key === key ? state.error : undefined,
    loading: Boolean(path) && state.key !== key,
    reload: useCallback(() => reload(), []),
  };
}
