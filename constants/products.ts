export interface ProductSeller {
  name: string;
  avatar: string;
  rating: number;
  sales: number;
  verified: boolean;
}

export interface ProductDetail {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  condition: string;
  category: string;
  images: string[];
  seller: ProductSeller;
  description: string;
  attributes: { label: string; value: string }[];
  location: string;
  postedAgo: string;
  views: number;
  favorites: number;
}

const SELLERS: Record<string, ProductSeller> = {
  jp: {
    name: 'Jean-Pierre Nguema',
    avatar:
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 4.9,
    sales: 128,
    verified: true,
  },
  estela: {
    name: 'Estela Nve',
    avatar:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 4.8,
    sales: 64,
    verified: true,
  },
  carlos: {
    name: 'Carlos Esono',
    avatar:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 4.7,
    sales: 39,
    verified: false,
  },
  lucia: {
    name: 'Lucía Borico',
    avatar:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200',
    rating: 5.0,
    sales: 92,
    verified: true,
  },
};

interface MakeOpts {
  subtitle?: string;
  originalPrice?: string;
  discount?: string;
  condition?: string;
  category?: string;
  images?: string[];
  seller?: ProductSeller;
  description?: string;
  attributes?: { label: string; value: string }[];
  location?: string;
  postedAgo?: string;
  views?: number;
  favorites?: number;
}

function make(
  id: string,
  title: string,
  price: string,
  image: string,
  opts: MakeOpts = {},
): ProductDetail {
  return {
    id,
    title,
    subtitle: opts.subtitle ?? 'Artículo en venta en Market EG',
    price,
    originalPrice: opts.originalPrice,
    discount: opts.discount,
    condition: opts.condition ?? 'Buen estado',
    category: opts.category ?? 'General',
    images: opts.images ?? [image],
    seller: opts.seller ?? SELLERS.jp,
    description:
      opts.description ??
      'Artículo en muy buen estado, poco uso y sin defectos. Entrega en mano en la ciudad o envío a todo el país. Cualquier duda, escríbeme.',
    attributes: opts.attributes ?? [
      { label: 'Estado', value: opts.condition ?? 'Buen estado' },
      { label: 'Categoría', value: opts.category ?? 'General' },
      { label: 'Ubicación', value: opts.location ?? 'Malabo, GE' },
      { label: 'Entrega', value: 'En mano / Envío' },
    ],
    location: opts.location ?? 'Malabo, Guinea Ecuatorial',
    postedAgo: opts.postedAgo ?? 'hace 2 días',
    views: opts.views ?? 156,
    favorites: opts.favorites ?? 12,
  };
}

const IMG = {
  tv: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800',
  macbook:
    'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=800',
  iphone:
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800',
  camera:
    'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=800',
  nike: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  watch:
    'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
  sony: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
  sofa: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  bike: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
  ps5: 'https://images.pexels.com/photos/12719149/pexels-photo-12719149.jpeg?auto=compress&cs=tinysrgb&w=800',
  fridge:
    'https://images.pexels.com/photos/2343468/pexels-photo-2343468.jpeg?auto=compress&cs=tinysrgb&w=800',
  guitar:
    'https://images.pexels.com/photos/164694/pexels-photo-164694.jpeg?auto=compress&cs=tinysrgb&w=800',
  car: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const CATALOG: ProductDetail[] = [
  make('1', 'Smart TV 55" 4K', '320.000 XAF', IMG.tv, {
    subtitle: 'Televisor LED 4K UHD de 55 pulgadas con Smart TV',
    condition: 'Como nuevo',
    category: 'Electrónica',
    seller: SELLERS.jp,
    location: 'Malabo, Guinea Ecuatorial',
    images: [
      'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
  }),
  make('2', 'MacBook Air M2', '850.000 XAF', IMG.macbook, {
    subtitle: 'Portátil Apple con chip M2, 8GB RAM, 256GB SSD',
    originalPrice: '950.000 XAF',
    discount: '-11%',
    condition: 'Como nuevo',
    category: 'Electrónica',
    seller: SELLERS.estela,
    location: 'Bata, Guinea Ecuatorial',
  }),
  make('3', 'iPhone 15 Pro', '750.000 XAF', IMG.iphone, {
    subtitle: 'iPhone 15 Pro 256GB, batería al 98%',
    condition: 'Buen estado',
    category: 'Electrónica',
    seller: SELLERS.carlos,
  }),
  make('4', 'Cámara Sony Alpha', '540.000 XAF', IMG.camera, {
    subtitle: 'Cámara mirrorless Sony Alpha con objetivo 28-70mm',
    condition: 'Buen estado',
    category: 'Electrónica',
    seller: SELLERS.lucia,
    location: 'Ebibeyin, Guinea Ecuatorial',
  }),
  make('5', 'Nike Air Zoom Pegasus 39', '65.000 XAF', IMG.nike, {
    subtitle: 'Calzado de running de alto rendimiento para hombre',
    originalPrice: '85.000 XAF',
    discount: '-24%',
    condition: 'Nuevo',
    category: 'Moda',
    seller: SELLERS.jp,
    attributes: [
      { label: 'Talla', value: '42 (EU)' },
      { label: 'Estado', value: 'Nuevo' },
      { label: 'Categoría', value: 'Moda' },
      { label: 'Ubicación', value: 'Malabo, GE' },
    ],
  }),
  make('6', 'Reloj Minimalista', '38.000 XAF', IMG.watch, {
    subtitle: 'Reloj de pulsera minimalista con correa de cuero',
    condition: 'Nuevo',
    category: 'Moda',
    seller: SELLERS.estela,
  }),
  make('u1', 'Smart TV 55" 4K', '320.000 XAF', IMG.tv, {
    condition: 'Como nuevo',
    category: 'Electrónica',
  }),
  make('u2', 'MacBook Air M2', '850.000 XAF', IMG.macbook, {
    condition: 'Como nuevo',
    category: 'Electrónica',
    seller: SELLERS.estela,
    location: 'Bata, Guinea Ecuatorial',
  }),
  make('u3', 'iPhone 15 Pro', '750.000 XAF', IMG.iphone, {
    category: 'Electrónica',
    seller: SELLERS.carlos,
  }),
  make('u4', 'Cámara Sony Alpha', '540.000 XAF', IMG.camera, {
    category: 'Electrónica',
    seller: SELLERS.lucia,
    location: 'Ebibeyin, Guinea Ecuatorial',
  }),
  make('u5', 'Nike Air Zoom', '65.000 XAF', IMG.nike, {
    condition: 'Nuevo',
    category: 'Moda',
  }),
  make('u6', 'Reloj Minimal', '38.000 XAF', IMG.watch, {
    condition: 'Nuevo',
    category: 'Moda',
  }),
  make('u7', 'Sony WH-1000XM5', '180.000 XAF', IMG.sony, {
    subtitle: 'Auriculares con cancelación de ruido líder del mercado',
    condition: 'Buen estado',
    category: 'Electrónica',
    location: 'Bata, Guinea Ecuatorial',
  }),
  make('u8', 'Sofá 3 plazas', '210.000 XAF', IMG.sofa, {
    subtitle: 'Sofá de tela de 3 plazas, muy cómodo',
    condition: 'Buen estado',
    category: 'Hogar',
    seller: SELLERS.estela,
  }),
  make('u9', 'Bicicleta de montaña', '125.000 XAF', IMG.bike, {
    subtitle: 'MTB 27.5", 21 velocidades, frenos de disco',
    condition: 'Buen estado',
    category: 'Deportes',
    seller: SELLERS.carlos,
    location: 'Ebibeyin, Guinea Ecuatorial',
  }),
  make('u10', 'PlayStation 5', '430.000 XAF', IMG.ps5, {
    subtitle: 'Consola PS5 con mando DualSense',
    condition: 'Como nuevo',
    category: 'Electrónica',
  }),
  make('u11', 'Nevera Samsung', '290.000 XAF', IMG.fridge, {
    subtitle: 'Nevera combi No Frost, bajo consumo',
    condition: 'Buen estado',
    category: 'Hogar',
    seller: SELLERS.estela,
    location: 'Bata, Guinea Ecuatorial',
  }),
  make('u12', 'Guitarra acústica', '72.000 XAF', IMG.guitar, {
    subtitle: 'Guitarra acústica con funda incluida',
    condition: 'Buen estado',
    category: 'Música',
    seller: SELLERS.lucia,
  }),
];

const PRODUCTS: Record<string, ProductDetail> = Object.fromEntries(
  CATALOG.map((p) => [p.id, p]),
);

const FALLBACK = PRODUCTS['5'];

export function getProductById(id?: string): ProductDetail {
  if (id && PRODUCTS[id]) return PRODUCTS[id];
  return FALLBACK;
}
