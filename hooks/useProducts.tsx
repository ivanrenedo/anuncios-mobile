import { useQuery, useMutation } from '@apollo/client/react';
// Apollo 4.x types `data` as `{}` unless a generic is given; these hooks shape
// the result themselves, so `<any>` keeps the existing loosely-typed style.
import {
  GET_PRODUCTS,
  GET_PRODUCT,
  SEARCH_PRODUCTS,
  PRODUCTS_BY_CATEGORY,
  PRODUCTS_BY_SELLER,
} from '@/graphql/queries';
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  VIEW_PRODUCT,
} from '@/graphql/mutations';

export function useProducts(take = 20, skip = 0) {
  const { data, loading, error, refetch } = useQuery<any>(GET_PRODUCTS, {
    variables: { take, skip },
  });
  return { products: data?.products ?? [], loading, error, refetch };
}

export function useProduct(id: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });
  return { product: data?.product ?? null, loading, error, refetch };
}

export function useSearchProducts() {
  const { data, loading, error, refetch } = useQuery<any>(SEARCH_PRODUCTS, {
    skip: true,
  });

  const search = (input: {
    query?: string;
    categoryId?: string;
    city?: string;
    condition?: string;
    priceMin?: number;
    priceMax?: number;
    sortBy?: string;
    take?: number;
    skip?: number;
  }) => refetch({ input });

  return { results: data?.searchProducts ?? [], loading, error, search };
}

export function useProductsByCategory(categoryId: string, take = 20, skip = 0) {
  const { data, loading, error, refetch } = useQuery<any>(PRODUCTS_BY_CATEGORY, {
    variables: { categoryId, take, skip },
    skip: !categoryId,
  });
  return { products: data?.productsByCategory ?? [], loading, error, refetch };
}

export function useProductsBySeller(sellerId: string) {
  const { data, loading, error, refetch } = useQuery<any>(PRODUCTS_BY_SELLER, {
    variables: { sellerId },
    skip: !sellerId,
  });
  return { products: data?.productsBySeller ?? [], loading, error, refetch };
}

export function useCreateProduct() {
  const [mutate, { loading, error }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });
  const create = (input: any) => mutate({ variables: { input } });
  return { create, loading, error };
}

export function useUpdateProduct() {
  const [mutate, { loading, error }] = useMutation(UPDATE_PRODUCT);
  const update = (id: string, input: any) =>
    mutate({ variables: { id, input } });
  return { update, loading, error };
}

export function useDeleteProduct() {
  const [mutate, { loading, error }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });
  const remove = (id: string) => mutate({ variables: { id } });
  return { remove, loading, error };
}

export function useViewProduct() {
  const [mutate] = useMutation(VIEW_PRODUCT);
  const trackView = (id: string) => mutate({ variables: { id } });
  return { trackView };
}
