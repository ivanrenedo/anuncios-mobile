import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { HOME_CAROUSEL_PREMIUM } from '@/graphql/queries';
import ProductRail from '@/components/ProductRail';
import type { ProductCardItem } from '@/components/ProductCard';
import { fmtPrice } from '@/components/ProductCard';
import { API_URL } from '@/lib/config';
import { timeAgo } from '@/lib/exploreUtils';

/**
 * v2 Fase 7b.2 — home carousel "Tiendas Premium" en mobile.
 *
 * Consume la misma query que el shop web (`homeCarouselPremium`). El backend
 * ya interleave round-robin, así que consecutive tiles vienen de sellers
 * distintos. Auto-hide si el día no hay Premium activos.
 */
export default function PremiumStoresRail({ take = 30 }: { take?: number }) {
  const { data } = useQuery<any>(HOME_CAROUSEL_PREMIUM, {
    variables: { take },
    fetchPolicy: 'cache-and-network',
  });

  const items: ProductCardItem[] = useMemo(() => {
    const raw = data?.homeCarouselPremium ?? [];
    return raw.map((p: any) => {
      const img = p.images?.[0]?.url || '';
      return {
        id: p.id,
        title: p.title,
        price: fmtPrice(Number(p.price)),
        priceRaw: Number(p.price),
        location: p.city,
        seller: p.seller?.name,
        sellerId: p.seller?.id,
        avatar: p.seller?.avatarUrl,
        verified: p.seller?.verified,
        sellerPlan: p.seller?.plan,
        priceReducedUntil: p.priceReducedUntil ?? null,
        image: img.startsWith('/') ? `${API_URL}${img}` : img,
        condition: p.condition,
        discount: p.discount,
        categoryLabel: p.category?.label,
        isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
        postedAgo: timeAgo(p.createdAt),
      };
    });
  }, [data]);

  if (items.length === 0) return null;

  return <ProductRail title="Tiendas Premium" icon="crown" items={items} />;
}
