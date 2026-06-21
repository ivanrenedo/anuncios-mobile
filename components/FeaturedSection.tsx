import React from 'react';
import { useRouter } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';
import ProductRail from '@/components/ProductRail';
import { ProductCardItem } from '@/components/ProductCard';

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: `${Number(p.price).toLocaleString('es')} XAF`,
    seller: p.seller?.name,
    verified: p.seller?.verified,
    avatar: p.seller?.avatarUrl,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    location: p.city,
    condition: p.condition,
  };
}

export default function FeaturedSection() {
  const router = useRouter();
  const { products, loading } = useProducts(6);

  const items = products.map(toCardItem);

  if (items.length === 0 && !loading) return null;

  return (
    <ProductRail
      title="Destacados en EG"
      items={items}
      cardWidth={200}
      loading={loading}
      onSeeAll={() => router.push('/(tabs)/explore')}
    />
  );
}
