import { useQuery } from '@apollo/client/react';
import { CATEGORY_TREE } from '@/graphql/queries';

/** Top-level categories with their nested children (the menu tree). */
export function useCategoryTree() {
  const { data, loading, error, refetch } = useQuery<any>(CATEGORY_TREE, { fetchPolicy: 'cache-and-network' });
  return { tree: data?.categoryTree ?? [], loading, error, refetch };
}
