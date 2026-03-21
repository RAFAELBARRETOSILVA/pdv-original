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

export interface DeliveryTier {
  id: string;
  fromKm: number;
  toKm: number;
  fee: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface OnlineOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distanceKm: number;
  items: CartItem[];
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Date;
  notes?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Preparando',
  delivering: 'Saiu p/ Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

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
