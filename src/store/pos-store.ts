import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Product,
  CartItem,
  PaymentSplit,
  Sale,
  DeliveryTier,
  OnlineOrder,
  OrderStatus,
  Customer,
  PaymentMethod,
  PaymentMethodConfig,
  PixConfig,
  CashRegisterSession,
  PrinterConfig,
  PendingOrder,
  OrderType,
} from '@/types/pos';

interface PendingOrderInput {
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  address?: string;
  neighborhood?: string;
  complement?: string;
  cep?: string;
  notes?: string;
  deliveryFee?: number;
  discount?: number;
}

interface PosState {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  pendingOrders: PendingOrder[];
  lastOrderNumber: number;
  deliveryFee: number;
  discount: number;
  isDelivery: boolean;
  deliveryTiers: DeliveryTier[];
  onlineOrders: OnlineOrder[];
  customers: Customer[];
  currentCustomerId?: string;

  storeName: string;
  storeLogo?: string;
  storePhone?: string;
  storeAddress?: string;
  storeCep?: string;
  storeCity?: string;
  storeState?: string;
  storeLatitude?: number;
  storeLongitude?: number;

  enabledPaymentMethods: PaymentMethod[];
  paymentConfig: Partial<Record<PaymentMethod, PaymentMethodConfig>>;
  pixConfig?: PixConfig;

  cashRegister?: CashRegisterSession;
  cashRegisterHistory: CashRegisterSession[];

  printerConfig?: PrinterConfig;
  menuLink?: string;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartObservation: (productId: string, observations: string) => void;
  clearCart: () => void;

  setDeliveryFee: (fee: number) => void;
  setDiscount: (discount: number) => void;
  setIsDelivery: (isDelivery: boolean) => void;

  finalizeSale: (payments: PaymentSplit[]) => void;

  addPendingOrder: (orderData: PendingOrderInput) => PendingOrder;
  updatePendingOrder: (id: string, updates: Partial<PendingOrder>) => void;
  removePendingOrder: (id: string) => void;
  markPendingOrderAsPaid: (
    id: string,
    payments: PaymentSplit[],
    options?: {
      paymentMethod?: PaymentMethod;
      customerName?: string;
    },
  ) => void;
  getPendingOrdersByTable: (tableNumber: string) => PendingOrder[];
  getOpenPendingOrders: () => PendingOrder[];

  addDeliveryTier: (tier: Omit<DeliveryTier, 'id'>) => void;
  updateDeliveryTier: (id: string, tier: Partial<DeliveryTier>) => void;
  removeDeliveryTier: (id: string) => void;
  getDeliveryFeeByKm: (km: number) => number;

  addOnlineOrder: (
    order: Omit<OnlineOrder, 'id' | 'createdAt' | 'status' | 'orderNumber'>,
  ) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  confirmPixPayment: (id: string) => void;

  addCustomer: (
    customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>,
  ) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  findCustomerByEmail: (email: string) => Customer | undefined;
  findCustomerByPhone: (phone: string) => Customer | undefined;
  setCurrentCustomer: (customerId?: string) => void;
  getCurrentCustomer: () => Customer | undefined;
  updateCustomerStats: (customerId: string, amount: number) => void;

  setStoreName: (name: string) => void;
  setStoreLogo: (logo?: string) => void;
  setStoreInfo: (info: {
    phone?: string;
    address?: string;
    cep?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  }) => void;

  setEnabledPaymentMethods: (methods: PaymentMethod[]) => void;
  updatePaymentConfig: (
    method: PaymentMethod,
    config: Partial<PaymentMethodConfig>,
  ) => void;
  setPixConfig: (config: PixConfig) => void;

  openCashRegister: (openingAmount: number, operatorName?: string) => void;
  closeCashRegister: (closingAmount: number) => void;
  getCashRegisterSummary: () => {
    totalByMethod: Record<PaymentMethod, number>;
    totalSales: number;
    salesCount: number;
    expectedAmount: number;
  } | null;

  setPrinterConfig: (config: PrinterConfig) => void;
  setMenuLink: (link?: string) => void;

  getSubtotal: () => number;
  getTotal: () => number;
}

const defaultTotalsByMethod = (): Record<PaymentMethod, number> => ({
  pix: 0,
  credit: 0,
  debit: 0,
  cash: 0,
  online: 0,
});

const normalizeText = (value?: string) => (value || '').trim();

const ticketPrefixByType = (orderType: OrderType): string => {
  if (orderType === 'delivery') return 'DELIVERY';
  if (orderType === 'retirada') return 'RETIRADA';
  if (orderType === 'mesa') return 'MESA';
  return 'PEDIDO';
};

const defaultOnlineOrderPaymentMethod: PaymentMethod = 'cash';

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      products: [],
      cart: [],
      sales: [],
      pendingOrders: [],
      lastOrderNumber: 0,
      deliveryFee: 0,
      discount: 0,
      isDelivery: false,
      deliveryTiers: [],
      onlineOrders: [],
      customers: [],
      currentCustomerId: undefined,

      storeName: 'Minha Loja',
      storeLogo: undefined,
      storePhone: undefined,
      storeAddress: undefined,
      storeCep: undefined,
      storeCity: undefined,
      storeState: undefined,
      storeLatitude: undefined,
      storeLongitude: undefined,

      enabledPaymentMethods: ['pix', 'credit', 'debit', 'cash'],
      paymentConfig: {
        pix: { enabled: true, label: 'PIX' },
        credit: { enabled: true, label: 'Crédito' },
        debit: { enabled: true, label: 'Débito' },
        cash: { enabled: true, label: 'Dinheiro' },
        online: { enabled: false, label: 'Online' },
      },
      pixConfig: undefined,

      cashRegister: undefined,
      cashRegisterHistory: [],

      printerConfig: undefined,
      menuLink: undefined,

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: crypto.randomUUID() }],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...updates } : product,
          ),
        })),

      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),

      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find(
            (item) => item.product.id === product.id,
          );

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            cart: [...state.cart, { product, quantity: 1, observations: '' }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      updateCartQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.product.id !== productId),
            };
          }

          return {
            cart: state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item,
            ),
          };
        }),

      updateCartObservation: (productId, observations) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, observations } : item,
          ),
        })),

      clearCart: () =>
        set({
          cart: [],
          deliveryFee: 0,
          discount: 0,
          isDelivery: false,
        }),

      setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
      setDiscount: (discount) => set({ discount }),
      setIsDelivery: (isDelivery) => set({ isDelivery }),

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

        set((current) => ({
          sales: [sale, ...current.sales],
          cart: [],
          deliveryFee: 0,
          discount: 0,
          isDelivery: false,
        }));
      },

      addPendingOrder: (orderData) => {
        const state = get();
        const nextNumber = state.lastOrderNumber + 1;
        const subtotal = state.getSubtotal();
        const deliveryFee =
          typeof orderData.deliveryFee === 'number'
            ? orderData.deliveryFee
            : state.deliveryFee;
        const discount =
          typeof orderData.discount === 'number'
            ? orderData.discount
            : state.discount;
        const total = subtotal + deliveryFee - discount;

        const prefix = ticketPrefixByType(orderData.orderType);

        const ticketLabel =
          orderData.orderType === 'mesa' && normalizeText(orderData.tableNumber)
            ? `#${prefix} ${normalizeText(orderData.tableNumber)}`
            : `#${prefix} ${nextNumber}`;

        const pendingOrder: PendingOrder = {
          id: crypto.randomUUID(),
          orderNumber: nextNumber,
          ticketLabel,
          orderType: orderData.orderType,
          status: 'open',
          customerId: orderData.customerId,
          customerName:
            normalizeText(orderData.customerName) ||
            (orderData.orderType === 'mesa'
              ? `Mesa ${normalizeText(orderData.tableNumber) || nextNumber}`
              : 'Cliente'),
          customerPhone: normalizeText(orderData.customerPhone),
          customerEmail: normalizeText(orderData.customerEmail),
          tableNumber: normalizeText(orderData.tableNumber),
          address: normalizeText(orderData.address),
          neighborhood: normalizeText(orderData.neighborhood),
          complement: normalizeText(orderData.complement),
          cep: normalizeText(orderData.cep),
          items: state.cart.map((item) => ({ ...item })),
          subtotal,
          deliveryFee,
          discount,
          total,
          notes: normalizeText(orderData.notes),
          createdAt: new Date(),
          paymentMethod: undefined,
          pixPaymentConfirmed: false,
        };

        set((current) => ({
          pendingOrders: [pendingOrder, ...current.pendingOrders],
          lastOrderNumber: nextNumber,
          cart: [],
          deliveryFee: 0,
          discount: 0,
          isDelivery: false,
        }));

        return pendingOrder;
      },

      updatePendingOrder: (id, updates) =>
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) =>
            order.id === id ? { ...order, ...updates } : order,
          ),
        })),

      removePendingOrder: (id) =>
        set((state) => ({
          pendingOrders: state.pendingOrders.filter((order) => order.id !== id),
        })),

      markPendingOrderAsPaid: (id, payments, options) => {
        const state = get();
        const order = state.pendingOrders.find((item) => item.id === id);
        if (!order) return;

        const sale: Sale = {
          id: crypto.randomUUID(),
          orderId: order.id,
          customerName: options?.customerName || order.customerName,
          orderType: order.orderType,
          tableNumber: order.tableNumber,
          items: order.items.map((item) => ({ ...item })),
          payments,
          deliveryFee: order.deliveryFee,
          discount: order.discount,
          total: order.total,
          isDelivery: order.orderType === 'delivery',
          createdAt: new Date(),
        };

        set((current) => ({
          sales: [sale, ...current.sales],
          pendingOrders: current.pendingOrders.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'paid',
                  paidAt: new Date(),
                  paymentMethod:
                    options?.paymentMethod || payments[0]?.method || 'cash',
                  pixPaymentConfirmed:
                    (options?.paymentMethod || payments[0]?.method) === 'pix'
                      ? true
                      : item.pixPaymentConfirmed,
                }
              : item,
          ),
        }));

        if (order.customerId) {
          get().updateCustomerStats(order.customerId, order.total);
        }

        const cash = get().cashRegister;
        if (cash?.isOpen) {
          const totalByMethod = { ...cash.totalByMethod };

          payments.forEach((payment) => {
            totalByMethod[payment.method] += payment.amount;
          });

          const totalSales = get().sales.reduce(
            (sum, currentSale) => sum + currentSale.total,
            0,
          );
          const salesCount = get().sales.length;

          set({
            cashRegister: {
              ...cash,
              totalByMethod,
              totalSales,
              salesCount,
            },
          });
        }
      },

      getPendingOrdersByTable: (tableNumber) =>
        get().pendingOrders.filter(
          (order) =>
            order.status === 'open' &&
            order.orderType === 'mesa' &&
            order.tableNumber === tableNumber,
        ),

      getOpenPendingOrders: () =>
        get().pendingOrders.filter((order) => order.status === 'open'),

      addDeliveryTier: (tier) =>
        set((state) => ({
          deliveryTiers: [
            ...state.deliveryTiers,
            { ...tier, id: crypto.randomUUID() },
          ],
        })),

      updateDeliveryTier: (id, tier) =>
        set((state) => ({
          deliveryTiers: state.deliveryTiers.map((item) =>
            item.id === id ? { ...item, ...tier } : item,
          ),
        })),

      removeDeliveryTier: (id) =>
        set((state) => ({
          deliveryTiers: state.deliveryTiers.filter((item) => item.id !== id),
        })),

      getDeliveryFeeByKm: (km) => {
        const tiers = [...get().deliveryTiers].sort((a, b) => a.fromKm - b.fromKm);
        const found = tiers.find((tier) => km >= tier.fromKm && km <= tier.toKm);
        return found ? found.fee : 0;
      },

      addOnlineOrder: (order) =>
        set((state) => {
          const nextNumber = state.lastOrderNumber + 1;

          const onlineOrder: OnlineOrder = {
            ...order,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            status: 'pending',
            orderNumber: nextNumber,
            paymentMethod: order.paymentMethod || defaultOnlineOrderPaymentMethod,
          };

          return {
            onlineOrders: [onlineOrder, ...state.onlineOrders],
            lastOrderNumber: nextNumber,
          };
        }),

      updateOrderStatus: (id, status) =>
        set((state) => ({
          onlineOrders: state.onlineOrders.map((order) =>
            order.id === id ? { ...order, status } : order,
          ),
        })),

      confirmPixPayment: (id) =>
        set((state) => ({
          onlineOrders: state.onlineOrders.map((order) =>
            order.id === id ? { ...order, pixPaymentConfirmed: true } : order,
          ),
          pendingOrders: state.pendingOrders.map((order) =>
            order.id === id ? { ...order, pixPaymentConfirmed: true } : order,
          ),
        })),

      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            {
              ...customer,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              totalOrders: 0,
              totalSpent: 0,
            },
          ],
        })),

      updateCustomer: (id, customer) =>
        set((state) => ({
          customers: state.customers.map((item) =>
            item.id === id ? { ...item, ...customer } : item,
          ),
        })),

      removeCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((item) => item.id !== id),
        })),

      getCustomer: (id) => get().customers.find((customer) => customer.id === id),

      findCustomerByEmail: (email) =>
        get().customers.find(
          (customer) => customer.email.toLowerCase() === email.toLowerCase(),
        ),

      findCustomerByPhone: (phone) =>
        get().customers.find(
          (customer) =>
            customer.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''),
        ),

      setCurrentCustomer: (customerId) => set({ currentCustomerId: customerId }),

      getCurrentCustomer: () => {
        const { currentCustomerId, customers } = get();
        return customers.find((customer) => customer.id === currentCustomerId);
      },

      updateCustomerStats: (customerId, amount) =>
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? {
                  ...customer,
                  totalOrders: customer.totalOrders + 1,
                  totalSpent: customer.totalSpent + amount,
                }
              : customer,
          ),
        })),

      setStoreName: (storeName) => set({ storeName }),
      setStoreLogo: (storeLogo) => set({ storeLogo }),

      setStoreInfo: (info) =>
        set({
          storePhone: info.phone,
          storeAddress: info.address,
          storeCep: info.cep,
          storeCity: info.city,
          storeState: info.state,
          storeLatitude: info.latitude,
          storeLongitude: info.longitude,
        }),

      setEnabledPaymentMethods: (methods) => set({ enabledPaymentMethods: methods }),

      updatePaymentConfig: (method, config) =>
        set((state) => ({
          paymentConfig: {
            ...state.paymentConfig,
            [method]: {
              enabled: state.paymentConfig[method]?.enabled ?? true,
              label: state.paymentConfig[method]?.label ?? method.toUpperCase(),
              ...config,
            },
          },
        })),

      setPixConfig: (pixConfig) => set({ pixConfig }),

      openCashRegister: (openingAmount, operatorName) =>
        set({
          cashRegister: {
            id: crypto.randomUUID(),
            openedAt: new Date(),
            openingAmount,
            salesCount: 0,
            totalByMethod: defaultTotalsByMethod(),
            totalSales: 0,
            operatorName,
            isOpen: true,
          },
        }),

      closeCashRegister: (closingAmount) => {
        const state = get();
        const summary = state.getCashRegisterSummary();
        const currentCash = state.cashRegister;

        if (!currentCash || !summary) return;

        const closedSession: CashRegisterSession = {
          ...currentCash,
          closedAt: new Date(),
          closingAmount,
          expectedAmount: summary.expectedAmount,
          totalByMethod: summary.totalByMethod,
          totalSales: summary.totalSales,
          salesCount: summary.salesCount,
          difference: closingAmount - summary.expectedAmount,
          isOpen: false,
        };

        set((current) => ({
          cashRegister: undefined,
          cashRegisterHistory: [closedSession, ...current.cashRegisterHistory],
        }));
      },

      getCashRegisterSummary: () => {
        const state = get();
        const currentCash = state.cashRegister;
        if (!currentCash) return null;

        const openedAt = new Date(currentCash.openedAt).getTime();

        const sessionSales = state.sales.filter(
          (sale) => new Date(sale.createdAt).getTime() >= openedAt,
        );

        const totalByMethod = defaultTotalsByMethod();

        sessionSales.forEach((sale) => {
          sale.payments.forEach((payment) => {
            totalByMethod[payment.method] += payment.amount;
          });
        });

        const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
        const salesCount = sessionSales.length;
        const expectedAmount = currentCash.openingAmount + totalByMethod.cash;

        return {
          totalByMethod,
          totalSales,
          salesCount,
          expectedAmount,
        };
      },

      setPrinterConfig: (printerConfig) => set({ printerConfig }),
      setMenuLink: (menuLink) => set({ menuLink }),

      getSubtotal: () =>
        get().cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        ),

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.deliveryFee - state.discount;
      },
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        products: state.products,
        sales: state.sales,
        pendingOrders: state.pendingOrders,
        lastOrderNumber: state.lastOrderNumber,
        deliveryFee: state.deliveryFee,
        discount: state.discount,
        isDelivery: state.isDelivery,
        deliveryTiers: state.deliveryTiers,
        onlineOrders: state.onlineOrders,
        customers: state.customers,
        currentCustomerId: state.currentCustomerId,
        storeName: state.storeName,
        storeLogo: state.storeLogo,
        storePhone: state.storePhone,
        storeAddress: state.storeAddress,
        storeCep: state.storeCep,
        storeCity: state.storeCity,
        storeState: state.storeState,
        storeLatitude: state.storeLatitude,
        storeLongitude: state.storeLongitude,
        enabledPaymentMethods: state.enabledPaymentMethods,
        paymentConfig: state.paymentConfig,
        pixConfig: state.pixConfig,
        cashRegister: state.cashRegister,
        cashRegisterHistory: state.cashRegisterHistory,
        printerConfig: state.printerConfig,
        menuLink: state.menuLink,
      }),
    },
  ),
);