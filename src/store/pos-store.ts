import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, PaymentSplit, Sale, DeliveryTier, OnlineOrder, OrderStatus } from '@/types/pos';

interface PosState {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  deliveryFee: number;
  discount: number;
  isDelivery: boolean;
  deliveryTiers: DeliveryTier[];
  onlineOrders: OnlineOrder[];
  storeName: string;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  
  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Sale settings
  setDeliveryFee: (fee: number) => void;
  setDiscount: (discount: number) => void;
  setIsDelivery: (isDelivery: boolean) => void;
  
  // Finalize
  finalizeSale: (payments: PaymentSplit[]) => void;
  
  // Delivery tiers
  addDeliveryTier: (tier: Omit<DeliveryTier, 'id'>) => void;
  updateDeliveryTier: (id: string, tier: Partial<DeliveryTier>) => void;
  removeDeliveryTier: (id: string) => void;
  getDeliveryFeeByKm: (km: number) => number;

  // Online orders
  addOnlineOrder: (order: Omit<OnlineOrder, 'id' | 'createdAt' | 'status'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  
  // Store settings
  setStoreName: (name: string) => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      products: [
        { id: '1', name: 'X-Burger', price: 22.90, category: 'Lanches', description: 'Pão, hambúrguer, queijo, alface e tomate' },
        { id: '2', name: 'X-Bacon', price: 27.90, category: 'Lanches', description: 'Pão, hambúrguer, queijo, bacon e molho especial' },
        { id: '3', name: 'X-Tudo', price: 32.90, category: 'Lanches', description: 'Pão, 2 hambúrgueres, queijo, bacon, ovo, presunto' },
        { id: '4', name: 'Coca-Cola 350ml', price: 6.00, category: 'Bebidas' },
        { id: '5', name: 'Guaraná 350ml', price: 5.50, category: 'Bebidas' },
        { id: '6', name: 'Suco Natural 500ml', price: 9.90, category: 'Bebidas' },
        { id: '7', name: 'Batata Frita P', price: 14.90, category: 'Porções' },
        { id: '8', name: 'Batata Frita G', price: 22.90, category: 'Porções' },
        { id: '9', name: 'Onion Rings', price: 18.90, category: 'Porções' },
        { id: '10', name: 'Milkshake', price: 16.90, category: 'Sobremesas' },
        { id: '11', name: 'Brownie', price: 12.90, category: 'Sobremesas' },
        { id: '12', name: 'Combo Burger + Batata + Refri', price: 39.90, category: 'Combos' },
      ],
      cart: [],
      sales: [],
      deliveryFee: 0,
      discount: 0,
      isDelivery: false,
      storeName: 'Minha Loja',
      deliveryTiers: [
        { id: '1', fromKm: 0, toKm: 1.5, fee: 3.00 },
        { id: '2', fromKm: 1.5, toKm: 3, fee: 5.00 },
        { id: '3', fromKm: 3, toKm: 5, fee: 8.00 },
        { id: '4', fromKm: 5, toKm: 10, fee: 12.00 },
      ],
      onlineOrders: [],

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: crypto.randomUUID() }],
      })),

      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),

      removeProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      })),

      addToCart: (product) => set((state) => {
        const existing = state.cart.find((item) => item.product.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return { cart: [...state.cart, { product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId),
      })),

      updateCartQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter((item) => item.product.id !== productId) };
        }
        return {
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        };
      }),

      clearCart: () => set({ cart: [], deliveryFee: 0, discount: 0, isDelivery: false }),

      setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
      setDiscount: (discount) => set({ discount }),
      setIsDelivery: (isDelivery) => set((state) => ({
        isDelivery,
        deliveryFee: isDelivery ? state.deliveryFee : 0,
      })),

      finalizeSale: (payments) => {
        const state = get();
        const sale: Sale = {
          id: crypto.randomUUID(),
          items: [...state.cart],
          payments,
          deliveryFee: state.deliveryFee,
          discount: state.discount,
          total: state.getTotal(),
          isDelivery: state.isDelivery,
          createdAt: new Date(),
        };
        set((s) => ({
          sales: [sale, ...s.sales],
          cart: [],
          deliveryFee: 0,
          discount: 0,
          isDelivery: false,
        }));
      },

      // Delivery tiers
      addDeliveryTier: (tier) => set((state) => ({
        deliveryTiers: [...state.deliveryTiers, { ...tier, id: crypto.randomUUID() }],
      })),

      updateDeliveryTier: (id, updates) => set((state) => ({
        deliveryTiers: state.deliveryTiers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      removeDeliveryTier: (id) => set((state) => ({
        deliveryTiers: state.deliveryTiers.filter((t) => t.id !== id),
      })),

      getDeliveryFeeByKm: (km) => {
        const state = get();
        const tier = state.deliveryTiers.find((t) => km >= t.fromKm && km < t.toKm);
        if (tier) return tier.fee;
        // If beyond all tiers, use the last tier's fee
        const sorted = [...state.deliveryTiers].sort((a, b) => b.toKm - a.toKm);
        return sorted.length > 0 && km >= sorted[0].toKm ? sorted[0].fee : 0;
      },

      // Online orders
      addOnlineOrder: (order) => set((state) => ({
        onlineOrders: [
          { ...order, id: crypto.randomUUID(), createdAt: new Date(), status: 'pending' as const },
          ...state.onlineOrders,
        ],
      })),

      updateOrderStatus: (id, status) => set((state) => ({
        onlineOrders: state.onlineOrders.map((o) => (o.id === id ? { ...o, status } : o)),
      })),

      setStoreName: (storeName) => set({ storeName }),

      getSubtotal: () => {
        const state = get();
        return state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getTotal: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        return subtotal + state.deliveryFee - state.discount;
      },
    }),
    {
      name: 'pos-storage',
    }
  )
);
