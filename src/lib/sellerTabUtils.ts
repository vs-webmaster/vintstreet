// Seller dashboard tab utilities

export type SellerTab =
  | 'setup'
  | 'streams'
  | 'myshow'
  | 'products'
  | 'orders'
  | 'finances'
  | 'offers'
  | 'reviews'
  | 'messages'
  | 'shipping'
  | 'settings';

const HASH_TO_TAB: Record<string, SellerTab> = {
  '#setup': 'setup',
  '#streams': 'streams',
  '#myshow': 'myshow',
  '#products': 'products',
  '#orders': 'orders',
  '#finances': 'finances',
  '#offers': 'offers',
  '#reviews': 'reviews',
  '#messages': 'messages',
  '#shipping': 'shipping',
  '#settings': 'settings',
};

export const getTabFromHash = (hash: string): SellerTab | null => {
  return HASH_TO_TAB[hash] || null;
};
