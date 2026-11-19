import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "./api";
import { useAuth } from "./auth";

type State<T> = { data: T | undefined; error: ApiError | undefined; loading: boolean };

/**
 * Load `path` from the backend (as the logged-in admin).
 *
 * - `path = null` waits (use it while a needed value isn't known yet).
 * - Changing the path loads the new data but KEEPS the old data on screen
 *   meanwhile (`loading` is true), so tables and charts don't flash empty.
 * - A 401 answer logs the admin out.
 * - `reload()` fetches the same path again.
 */
export function useApi<T>(path: string | null) {
  const { token, logout } = useAuth();
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: path !== null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    // New path (or reload): flag it as loading right away, while the previous data stays visible.
    setState((previous) => (previous.loading ? previous : { ...previous, loading: true }));
    api<T>(path, { token })
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, "UNKNOWN_ERROR", "Something went wrong.");
        if (apiError.status === 401) logout();
        setState((previous) => ({ ...previous, error: apiError, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, token, version, logout]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true }));
    setVersion((value) => value + 1);
  }, []);

  // While a new path loads, show that it is loading (the old data stays).
  const loading = state.loading || (path !== null && state.data === undefined && state.error === undefined);
  return { data: state.data, error: state.error, loading, reload };
}
