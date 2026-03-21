import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { PaymentMethod, PAYMENT_LABELS } from '@/types/pos';
import { Minus, Plus, Trash2, Truck, Tag, CreditCard, Smartphone, Banknote, Globe, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const PAYMENT_CONFIG: { method: PaymentMethod; icon: React.ReactNode; colorClass: string }[] = [
  { method: 'pix', icon: <Smartphone className="h-4 w-4" />, colorClass: 'bg-pos-pix' },
  { method: 'credit', icon: <CreditCard className="h-4 w-4" />, colorClass: 'bg-pos-card-pay' },
  { method: 'debit', icon: <CreditCard className="h-4 w-4" />, colorClass: 'bg-pos-card-pay/80' },
  { method: 'cash', icon: <Banknote className="h-4 w-4" />, colorClass: 'bg-pos-cash' },
  { method: 'online', icon: <Globe className="h-4 w-4" />, colorClass: 'bg-pos-online' },
];

export function CartPanel() {
  const {
    cart, deliveryFee, discount, isDelivery,
    removeFromCart, updateCartQuantity, clearCart,
    setDeliveryFee, setDiscount, setIsDelivery,
    getSubtotal, getTotal, finalizeSale,
  } = usePosStore();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix');
  const [showPayment, setShowPayment] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleFinalize = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }
    finalizeSale([{ method: selectedPayment, amount: total }]);
    toast.success('Venda finalizada com sucesso!');
    setShowPayment(false);
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Carrinho</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-destructive text-xs font-medium hover:underline active:scale-95 transition-transform">
              Limpar
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-xs mt-0.5">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto pos-scrollbar px-5 py-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-8">
            <span className="text-4xl opacity-30">🛒</span>
            <p className="text-sm">Carrinho vazio</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 animate-slide-in"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-primary font-semibold">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-90 transition-all"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-90 transition-all"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-all ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Options & Totals */}
      <div className="border-t border-border px-5 py-4 space-y-3">
        {/* Delivery toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Truck className="h-4 w-4 text-pos-delivery" />
            <span className="font-medium">Delivery</span>
          </label>
          <button
            onClick={() => setIsDelivery(!isDelivery)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isDelivery ? 'bg-pos-delivery' : 'bg-secondary'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDelivery ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {isDelivery && (
          <div className="flex items-center gap-2 animate-slide-in">
            <span className="text-xs text-muted-foreground">Taxa:</span>
            <input
              type="number"
              value={deliveryFee || ''}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              placeholder="0,00"
              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
        )}

        {/* Discount */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-pos-warning" />
          <span className="text-xs text-muted-foreground">Desconto:</span>
          <input
            type="number"
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value))}
            placeholder="0,00"
            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
          />
        </div>

        {/* Summary */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {isDelivery && deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Entrega</span>
              <span className="tabular-nums">+ {formatCurrency(deliveryFee)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-pos-warning">
              <span>Desconto</span>
              <span className="tabular-nums">- {formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment / Finalize */}
        {!showPayment ? (
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 shadow-lg shadow-primary/20"
          >
            Pagamento
          </button>
        ) : (
          <div className="space-y-3 animate-slide-in">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Forma de pagamento</p>
              <button onClick={() => setShowPayment(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_CONFIG.map(({ method, icon, colorClass }) => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                    selectedPayment === method
                      ? `border-primary ${colorClass} text-white shadow-md`
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  {icon}
                  <span className="text-[10px] font-semibold">{PAYMENT_LABELS[method]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleFinalize}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Check className="h-4 w-4" />
              Finalizar — {formatCurrency(total)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
