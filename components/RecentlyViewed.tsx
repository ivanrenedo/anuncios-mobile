import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import ProductRail from '@/components/ProductRail';
import { ProductCardItem } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: `${Number(p.price).toLocaleString('es')} XAF`,
    seller: p.seller?.name,
    avatar: p.seller?.avatarUrl,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
  };
}

export default function RecentlyViewed() {
  const router = useRouter();
  const { products } = useProducts(6);

  const items = useMemo(
    () => products.slice(0, 6).map(toCardItem),
    [products]
  );

  if (items.length === 0) return null;

  return (
    <ProductRail
      title="Vistos recientemente"
      items={items}
      cardWidth={160}
      onSeeAll={() => router.push('/(tabs)/explore')}
    />
  );
}
