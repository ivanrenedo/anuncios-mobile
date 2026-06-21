import { useQuery, useMutation } from '@apollo/client/react';
import { REVIEWS_BY_SELLER, SELLER_RATING } from '@/graphql/queries';
import { CREATE_REVIEW, DELETE_REVIEW } from '@/graphql/mutations';

export function useReviewsBySeller(sellerId: string) {
  const { data, loading, error, refetch } = useQuery<any>(REVIEWS_BY_SELLER, {
    variables: { sellerId },
    skip: !sellerId,
  });
  return { reviews: data?.reviewsBySeller ?? [], loading, error, refetch };
}

export function useSellerRating(sellerId: string) {
  const { data, loading } = useQuery<any>(SELLER_RATING, {
    variables: { sellerId },
    skip: !sellerId,
  });
  return {
    average: data?.sellerRating?.average ?? 0,
    count: data?.sellerRating?.count ?? 0,
    loading,
  };
}

export function useCreateReview() {
  const [mutate, { loading, error }] = useMutation(CREATE_REVIEW);
  const create = (input: { sellerId: string; rating: number; text?: string }) =>
    mutate({
      variables: { input },
      refetchQueries: [
        { query: REVIEWS_BY_SELLER, variables: { sellerId: input.sellerId } },
        { query: SELLER_RATING, variables: { sellerId: input.sellerId } },
      ],
    });
  return { create, loading, error };
}

export function useDeleteReview() {
  const [mutate, { loading }] = useMutation(DELETE_REVIEW);
  const remove = (id: string) => mutate({ variables: { id } });
  return { remove, loading };
}
