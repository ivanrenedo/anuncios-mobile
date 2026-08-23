import { useQuery, useMutation } from '@apollo/client/react';
import type { OnQueryUpdated } from '@apollo/client';
import {
  GET_PRODUCTS,
  GET_PRODUCT,
  SEARCH_PRODUCTS,
  PRODUCTS_BY_CATEGORY,
  PRODUCTS_BY_SELLER,
  MY_VIEWS_DAILY,
} from '@/graphql/queries';
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  VIEW_PRODUCT,
  CONTACT_PRODUCT,
} from '@/graphql/mutations';

// Refetch by operation NAME so every active product list refreshes regardless
// of its variables (take/skip, sellerId, categoryId…). This is what makes a new
// or edited product show up instantly without remounting the screen. Includes
// the Home ('HomeSections'/'SectionProducts') so a freshly-posted ad appears in
// the feed without pull-to-refresh.
const PRODUCT_LIST_QUERY_NAMES = new Set([
  'Products',
  'ProductsBySeller',
  'ProductsByCategory',
  'SearchProducts',
  'HomeSections',
  'SectionProducts',
]);
const PRODUCT_DETAIL_QUERY_NAMES = new Set([...PRODUCT_LIST_QUERY_NAMES, 'Product']);

function isAbortError(error: unknown) {
  const err = error as { name?: string; message?: string } | undefined;
  return (
    err?.name === 'AbortError' ||
    err?.message?.toLowerCase().includes('aborted') === true
  );
}

async function ignoreAbort<T>(promise: Promise<T>) {
  try {
    return await promise;
  } catch (error) {
    if (isAbortError(error)) return undefined;
    throw error;
  }
}

function productRefetchOptions(queryNames = PRODUCT_LIST_QUERY_NAMES) {
  const onQueryUpdated: OnQueryUpdated<Promise<any>> = (observableQuery) => {
    const queryName = observableQuery.queryName;
    return queryName && queryNames.has(queryName) ? observableQuery.refetch() : false;
  };

  return {
    refetchQueries: 'active' as const,
    awaitRefetchQueries: true,
    onQueryUpdated,
  };
}

export function useProducts(take = 20, skip = 0) {
  const { data, previousData, loading, error, refetch } = useQuery<any>(GET_PRODUCTS, {
    variables: { take, skip },
    fetchPolicy: 'cache-and-network',
  });
  return { products: data?.products ?? previousData?.products ?? [], loading, error, refetch };
}

export function useProduct(id: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });
  return { product: data?.product ?? null, loading, error, refetch };
}

export function useProductsByCategory(categoryId: string, take = 20, skip = 0) {
  const { data, loading, error, refetch } = useQuery<any>(PRODUCTS_BY_CATEGORY, {
    variables: { categoryId, take, skip },
    skip: !categoryId,
    fetchPolicy: 'cache-and-network',
  });
  return { products: data?.productsByCategory ?? [], loading, error, refetch };
}

export function useProductsBySeller(sellerId: string) {
  const { data, loading, error, refetch } = useQuery<any>(PRODUCTS_BY_SELLER, {
    variables: { sellerId },
    skip: !sellerId,
    fetchPolicy: 'cache-and-network',
  });
  return { products: data?.productsBySeller ?? [], loading, error, refetch };
}

export function useCreateProduct() {
  const [mutate, { loading, error }] = useMutation(CREATE_PRODUCT, productRefetchOptions());
  const create = (input: any) => mutate({ variables: { input } });
  return { create, loading, error };
}

export function useUpdateProduct() {
  const [mutate, { loading, error }] = useMutation(UPDATE_PRODUCT, productRefetchOptions(PRODUCT_DETAIL_QUERY_NAMES));
  const update = (id: string, input: any) =>
    mutate({ variables: { id, input } });
  return { update, loading, error };
}

export function useDeleteProduct() {
  const [mutate, { loading, error }] = useMutation(DELETE_PRODUCT, productRefetchOptions());
  const remove = (id: string) => mutate({ variables: { id } });
  return { remove, loading, error };
}

export function useRelatedProducts(title: string, categoryId: string) {
  const keywords = title
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .join(' ');

  const { data: byCat, loading: l1, refetch: r1 } = useQuery<any>(SEARCH_PRODUCTS, {
    variables: { input: { categoryId: categoryId || undefined, take: 11 } },
    skip: !categoryId,
    fetchPolicy: 'cache-and-network',
  });

  const { data: byTitle, loading: l2, refetch: r2 } = useQuery<any>(SEARCH_PRODUCTS, {
    variables: { input: { query: keywords || undefined, take: 11 } },
    skip: !keywords,
    fetchPolicy: 'cache-and-network',
  });

  const merged = [...(byCat?.searchProducts ?? [])];
  for (const p of byTitle?.searchProducts ?? []) {
    if (!merged.some((m: any) => m.id === p.id)) merged.push(p);
  }

  const refetch = async () => {
    const tasks: Promise<unknown>[] = [];
    if (categoryId) tasks.push(ignoreAbort(r1()));
    if (keywords) tasks.push(ignoreAbort(r2()));
    await Promise.all(tasks);
  };
  return { products: merged, loading: l1 || l2, refetch };
}

export function useViewProduct() {
  const [mutate] = useMutation(VIEW_PRODUCT);
  const trackView = (id: string, viewerKey?: string) =>
    mutate({ variables: { id, viewerKey } });
  return { trackView };
}

/** Fire-and-forget contact stat: a buyer tapped WhatsApp/call on a listing. */
export function useContactProduct() {
  const [mutate] = useMutation(CONTACT_PRODUCT);
  const trackContact = (id: string) =>
    mutate({ variables: { id } }).catch(() => {});
  return { trackContact };
}

/** Daily unique views across my listings, for the PREMIUM stats chart. */
export function useMyViewsDaily(enabled: boolean, days = 7) {
  const { data, loading } = useQuery<any>(MY_VIEWS_DAILY, {
    variables: { days },
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
  });
  return { daily: data?.myViewsDaily ?? [], loading };
}
