export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'online';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  payments: PaymentSplit[];
  deliveryFee: number;
  discount: number;
  total: number;
  isDelivery: boolean;
  createdAt: Date;
}

export const CATEGORIES = [
  'Todos',
  'Lanches',
  'Bebidas',
  'Porções',
  'Sobremesas',
  'Combos',
  'Outros',
] as const;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit: 'Crédito',
  debit: 'Débito',
  cash: 'Dinheiro',
  online: 'Online',
};
