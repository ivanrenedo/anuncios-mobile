import { useQuery, useMutation } from '@apollo/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GET_HOME_SECTIONS } from '@/graphql/queries';
import { TRACK_HOME_SECTION_EVENT } from '@/graphql/mutations';
import { getViewerKey } from '@/lib/viewer';

export interface HomeSectionProduct {
  id: string;
  title: string;
  price: number;
  discount?: number;
  condition?: string;
  city?: string;
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  seller?: {
    id: string;
    name: string;
    avatarUrl?: string;
    verified?: boolean;
    plan?: string;
  };
  category?: { id: string; slug: string; label: string; color?: string };
  images?: { id: string; url: string; sortOrder: number }[];
}

export interface HomeSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  filter?: any;
  config?: any;
  sortOrder: number;
  products: HomeSectionProduct[];
}

export function useHomeSections() {
  const [viewerKey, setViewerKey] = useState<string | null>(null);
  const viewerKeyRef = useRef<string | null>(null);

  useEffect(() => {
    getViewerKey().then((k) => {
      viewerKeyRef.current = k;
      setViewerKey(k);
    });
  }, []);

  const { data, loading, refetch } = useQuery(GET_HOME_SECTIONS, {
    variables: { viewerKey },
    skip: viewerKey === null,
    fetchPolicy: 'network-only',
  });

  const [trackMutation] = useMutation(TRACK_HOME_SECTION_EVENT);

  const trackEvent = useCallback(
    async (sectionId: string, event: 'impression' | 'click') => {
      const vk = viewerKeyRef.current ?? (await getViewerKey());
      trackMutation({
        variables: { sectionId, event, viewerKey: vk },
      }).catch(() => {});
    },
    [trackMutation],
  );

  const sections: HomeSection[] = (data as any)?.homeSections ?? [];

  return {
    sections,
    loading: viewerKey === null || loading,
    refetch,
    trackEvent,
  };
}
