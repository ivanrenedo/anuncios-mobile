import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import ProductRail from '@/components/ProductRail';
import { ProductCardItem, fmtPrice } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const mo = Math.floor(d / 30);
  return `hace ${mo} meses`;
}

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: fmtPrice(Number(p.price)),
    priceRaw: Number(p.price),
    seller: p.seller?.name,
    sellerId: p.seller?.id,
    avatar: p.seller?.avatarUrl,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    discount: p.discount,
    categoryLabel: p.category?.label,
    operation: p.propertyDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    postedAgo: timeAgo(p.createdAt),
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
