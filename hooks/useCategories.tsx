import { useQuery } from '@apollo/client/react';
import {
  CATEGORY_TREE,
  GET_CATEGORIES,
  CATEGORY_BY_SLUG,
  CATEGORY_CHILDREN,
} from '@/graphql/queries';

/** Top-level categories with their nested children (the menu tree). */
export function useCategoryTree() {
  const { data, loading, error, refetch } = useQuery<any>(CATEGORY_TREE);
  return { tree: data?.categoryTree ?? [], loading, error, refetch };
}

/** Flat list of every category node. */
export function useCategories() {
  const { data, loading, error, refetch } = useQuery<any>(GET_CATEGORIES);
  return { categories: data?.categories ?? [], loading, error, refetch };
}

export function useCategoryBySlug(slug: string) {
  const { data, loading, error } = useQuery<any>(CATEGORY_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });
  return { category: data?.categoryBySlug ?? null, loading, error };
}

/** Direct children of a category (replaces the old subcategories query). */
export function useCategoryChildren(parentId: string) {
  const { data, loading, error } = useQuery<any>(CATEGORY_CHILDREN, {
    variables: { parentId },
    skip: !parentId,
  });
  return { children: data?.categoryChildren ?? [], loading, error };
}
