import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { CATEGORY_TREE } from '@/graphql/queries';

/**
 * Appends an alpha channel to a hex color for tinted backgrounds. Category
 * colors come from the DB as `#RRGGBB` (or occasionally `#RRGGBBAA`); either
 * way we drop any existing alpha and stamp our own. Falls back to the input
 * unchanged when it's not a 6/8-digit hex, so text/border usage still works.
 */
export function withAlpha(hex: string | null | undefined, alphaHex: string): string {
  if (!hex || typeof hex !== 'string') return hex ?? '';
  const base = hex.length >= 7 ? hex.slice(0, 7) : hex;
  return base.length === 7 ? base + alphaHex : hex;
}

/** Top-level categories with their nested children (the menu tree). */
export function useCategoryTree() {
  const { data, loading, error, refetch } = useQuery<any>(CATEGORY_TREE);
  return { tree: data?.categoryTree ?? [], loading, error, refetch };
}

/**
 * `categoryId → rootCategoryId` lookup built from the tree. Products carry
 * their leaf category id (e.g. a subcategory two levels deep); when the UI
 * filters by top-level category we need to know which root each product rolls
 * up to. Memoized so the walk runs once per tree change.
 */
export function useCategoryRootMap(tree: any[]) {
  return useMemo(() => {
    const map = new Map<string, string>();
    const walk = (node: any, rootId: string) => {
      if (!node?.id) return;
      map.set(node.id, rootId);
      const children = node.children ?? [];
      for (const child of children) walk(child, rootId);
    };
    for (const root of tree ?? []) walk(root, root.id);
    return map;
  }, [tree]);
}
