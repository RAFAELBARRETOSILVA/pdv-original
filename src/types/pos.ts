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
  observations?: string;
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
  orderId?: string;
  customerName?: string;
  orderType?: OrderType;
  tableNumber?: string;
}

export interface DeliveryTier {
  id: string;
  fromKm: number;
  toKm: number;
  fee: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type OrderType = 'mesa' | 'delivery' | 'balcao' | 'retirada';
export type PendingOrderStatus = 'open' | 'paid' | 'cancelled';

export interface OnlineOrder {
  id: string;
  orderNumber: number;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  neighborhood?: string;
  complement?: string;
  distanceKm: number;
  deliveryType: 'delivery' | 'pickup' | 'table';
  items: CartItem[];
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  pixPaymentConfirmed?: boolean;
  status: OrderStatus;
  createdAt: Date;
  notes?: string;
  source: 'online' | 'manual';
}

export interface PendingOrder {
  id: string;
  orderNumber: number;
  ticketLabel: string;
  orderType: OrderType;
  status: PendingOrderStatus;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  address?: string;
  neighborhood?: string;
  complement?: string;
  cep?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: Date;
  paidAt?: Date;
  paymentMethod?: PaymentMethod;
  pixPaymentConfirmed?: boolean;
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

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave Aleatória',
};

export interface PixConfig {
  pixKey: string;
  pixKeyType: PixKeyType;
  bankName: string;
  beneficiaryName: string;
}

export type PrinterType = 'thermal' | 'fiscal' | 'common' | 'auto';

export const PRINTER_TYPE_LABELS: Record<PrinterType, string> = {
  thermal: 'Térmica',
  fiscal: 'Fiscal',
  common: 'Comum',
  auto: 'Automática',
};

export interface PrinterConfig {
  printerName: string;
  kitchenPrinterName?: string;
  printerType: PrinterType;
  paperWidth: number;
  autoPrint: boolean;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  label: string;
}

export interface CashRegisterSession {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  salesCount: number;
  totalByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  difference?: number;
  operatorName?: string;
  isOpen: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  complement?: string;
  createdAt: Date;
  totalOrders: number;
  totalSpent: number;
}