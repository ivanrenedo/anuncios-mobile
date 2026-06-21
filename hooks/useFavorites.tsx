import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from './useAuth';
import { MY_FAVORITES, IS_FAVORITED } from '@/graphql/queries';
import { TOGGLE_FAVORITE } from '@/graphql/mutations';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery<any>(MY_FAVORITES, {
    skip: !isAuthenticated,
  });
  return { favorites: data?.myFavorites ?? [], loading, error, refetch };
}

export function useIsFavorited(productId: string) {
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery<any>(IS_FAVORITED, {
    variables: { productId },
    skip: !productId || !isAuthenticated,
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
