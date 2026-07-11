import { useQuery, useMutation } from '@apollo/client/react';
import { MY_SAVED_SEARCHES } from '@/graphql/queries';
import { CREATE_SAVED_SEARCH, DELETE_SAVED_SEARCH } from '@/graphql/mutations';

export interface SavedSearchInput {
  query?: string;
  categoryId?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
}

export function useSavedSearches(enabled: boolean) {
  const { data, loading, refetch } = useQuery<any>(MY_SAVED_SEARCHES, {
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
  });

  const [createMutation, { loading: saving }] = useMutation(CREATE_SAVED_SEARCH, {
    refetchQueries: ['MySavedSearches'],
    awaitRefetchQueries: true,
  });
  const [deleteMutation, { loading: removing }] = useMutation(DELETE_SAVED_SEARCH, {
    refetchQueries: ['MySavedSearches'],
    awaitRefetchQueries: true,
  });

  const save = (input: SavedSearchInput) =>
    createMutation({ variables: { input } });
  const remove = (id: string) => deleteMutation({ variables: { id } });

  return {
    searches: data?.mySavedSearches ?? [],
    loading,
    saving,
    removing,
    save,
    remove,
    refetch,
  };
}
