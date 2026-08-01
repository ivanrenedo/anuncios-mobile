import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';

type Refetcher = (() => Promise<unknown>) | (() => unknown);

/**
 * Runs the given refetch functions every time the screen regains focus.
 * The initial mount is skipped because Apollo's first query already runs
 * then — refetching again would just double-fetch on cold boot.
 *
 * Implementation uses `useIsFocused` + `useEffect` on the boolean rather
 * than `useFocusEffect`, because the latter re-subscribes on every render
 * when the callback identity changes (an inline array literal from the
 * caller is a new reference each render). The boolean flips only on real
 * focus/blur transitions, so the effect fires exactly when we want.
 *
 * Callers may pass a single refetcher or an array literal — no need to
 * `useCallback`/`useMemo`; the latest reference is stashed in a ref so
 * changes across renders don't retrigger the effect.
 */
export function useRefetchOnFocus(refetchers: Refetcher | Refetcher[]) {
  const isFocused = useIsFocused();
  const firstFocus = useRef(true);
  const latest = useRef(refetchers);
  latest.current = refetchers;

  useEffect(() => {
    if (!isFocused) return;
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    const list = Array.isArray(latest.current)
      ? latest.current
      : [latest.current];
    // Fire-and-forget: focus refetch is a UX freshness signal, not a
    // blocking load. Errors are swallowed so a stale token (401 on
    // refetch) doesn't crash the screen.
    Promise.allSettled(
      list.map((fn) => Promise.resolve().then(() => fn())),
    );
  }, [isFocused]);
}
