import { useQuery, useMutation } from '@apollo/client/react';
import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFavoritesStore } from '@/store/favoritesStore';
import { MY_FAVORITES, IS_FAVORITED } from '@/graphql/queries';
import { TOGGLE_FAVORITE } from '@/graphql/mutations';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery<any>(MY_FAVORITES, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  return { favorites: data?.myFavorites ?? [], loading, error, refetch };
}

export function useIsFavorited(productId: string) {
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery<any>(IS_FAVORITED, {
    variables: { productId },
    skip: !productId || !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  return { isFavorited: data?.isFavorited ?? false, loading };
}

export function useToggleFavorite() {
  const [mutate, { loading }] = useMutation<any>(TOGGLE_FAVORITE, {
    refetchQueries: [{ query: MY_FAVORITES }],
  });
  const toggle = async (productId: string) => {
    const res = await mutate({ variables: { productId } });
    return res.data?.toggleFavorite?.added ?? false;
  };
  return { toggle, loading };
}

/**
 * Hydrates the shared favorites store from the server. Mount ONCE near the app
 * root (see app/_layout.tsx) so every screen reads the same favorite set.
 */
export function useFavoritesSync() {
  const { isAuthenticated } = useAuth();
  const setFromServer = useFavoritesStore((s) => s.setFromServer);
  const clear = useFavoritesStore((s) => s.clear);
  const { data } = useQuery<any>(MY_FAVORITES, { skip: !isAuthenticated, fetchPolicy: 'cache-and-network' });

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      return;
    }
    const favs = data?.myFavorites;
    if (favs) {
      setFromServer(favs.map((f: any) => f.product?.id).filter(Boolean));
    }
  }, [isAuthenticated, data, setFromServer, clear]);
}

/**
 * Reads/writes the shared favorites store: the heart reflects the app-wide
 * favorite set and flips instantly (optimistic) on tap, reverting on failure.
 */
export function useFavoriteToggle() {
  const { isAuthenticated } = useAuth();
  const ids = useFavoritesStore((s) => s.ids);
  const setOptimistic = useFavoritesStore((s) => s.setOptimistic);
  const [mutate] = useMutation<any>(TOGGLE_FAVORITE, {
    refetchQueries: [{ query: MY_FAVORITES }],
  });

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggleFavorite = useCallback(
    (id: string) => {
      if (!isAuthenticated || !id) return;
      const next = !ids.has(id);
      setOptimistic(id, next);
      mutate({ variables: { productId: id } }).catch(() =>
        setOptimistic(id, !next),
      );
    },
    [isAuthenticated, ids, setOptimistic, mutate],
  );

  return { isFavorite, toggleFavorite };
}
