import { create } from 'zustand';

/**
 * Single source of truth for which products the user has favorited, shared by
 * every screen so hearts stay in sync app-wide. Hydrated from MY_FAVORITES
 * (see useFavoritesSync) and updated optimistically on toggle.
 */
interface FavoritesState {
  ids: Set<string>;
  setFromServer: (ids: string[]) => void;
  setOptimistic: (id: string, favorite: boolean) => void;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  ids: new Set<string>(),
  setFromServer: (ids) => set({ ids: new Set(ids) }),
  setOptimistic: (id, favorite) =>
    set((s) => {
      const next = new Set(s.ids);
      if (favorite) next.add(id);
      else next.delete(id);
      return { ids: next };
    }),
  clear: () => set({ ids: new Set<string>() }),
}));
