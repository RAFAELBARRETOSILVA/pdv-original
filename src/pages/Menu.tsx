import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { CartItem, PaymentMethod, PAYMENT_LABELS, CATEGORIES } from '@/types/pos';
import { Minus, Plus, ShoppingBag, Trash2, MapPin, Phone, User, MessageSquare, Smartphone, CreditCard, Banknote, ChevronLeft, Check, Truck, Search } from 'lucide-react';
import { toast } from 'sonner';

type MenuStep = 'browse' | 'cart' | 'checkout';

export default function Menu() {
  const { products, deliveryTiers, storeName, getDeliveryFeeByKm, addOnlineOrder } = usePosStore();
  const [step, setStep] = useState<MenuStep>('browse');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  // Checkout fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('pix');

  const deliveryFee = getDeliveryFeeByKm(distanceKm);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const addToCart = (product: CartItem['product']) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado`);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== id));
    } else {
      setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSubmitOrder = () => {
    if (!name || !phone || !address) {
      toast.error('Preencha nome, telefone e endereço');
      return;
    }
    if (cart.length === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }
    addOnlineOrder({
      customerName: name,
      customerPhone: phone,
      address,
      distanceKm,
      items: cart,
      deliveryFee,
      subtotal,
      total,
      paymentMethod: payment,
      notes,
    });
    toast.success('Pedido enviado com sucesso! 🎉');
    setCart([]);
    setName('');
    setPhone('');
    setAddress('');
    setDistanceKm(0);
    setNotes('');
    setStep('browse');
  };

  const PAYMENT_OPTIONS: { method: PaymentMethod; icon: React.ReactNode }[] = [
    { method: 'pix', icon: <Smartphone className="h-4 w-4" /> },
    { method: 'credit', icon: <CreditCard className="h-4 w-4" /> },
    { method: 'debit', icon: <CreditCard className="h-4 w-4" /> },
    { method: 'cash', icon: <Banknote className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {step !== 'browse' ? (
            <button onClick={() => setStep(step === 'checkout' ? 'cart' : 'browse')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div>
              <h1 className="font-bold text-lg leading-tight">{storeName}</h1>
              <p className="text-xs text-muted-foreground">Cardápio Online</p>
            </div>
          )}
          {step === 'browse' && (
            <button
              onClick={() => setStep('cart')}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              <ShoppingBag className="h-4 w-4" />
              Sacola
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          {step === 'checkout' && (
            <p className="font-semibold text-sm">Finalizar Pedido</p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* STEP: BROWSE */}
        {step === 'browse' && (
          <div className="animate-fade-in">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="O que você quer comer?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 pos-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Delivery info banner */}
            {deliveryTiers.length > 0 && (
              <div className="bg-pos-delivery/10 border border-pos-delivery/20 rounded-xl p-3 mb-5 flex items-start gap-3">
                <Truck className="h-5 w-5 text-pos-delivery shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-pos-delivery">Taxa de Entrega</p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {deliveryTiers.map((t) => (
                      <p key={t.id}>
                        {t.fromKm}km a {t.toKm}km → <span className="font-semibold text-foreground">{fmt(t.fee)}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Product list */}
            <div className="space-y-3">
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all animate-slide-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="w-16 h-16 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0 text-2xl">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="opacity-40">🍔</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                    )}
                    <p className="text-primary font-bold text-sm mt-1">{fmt(product.price)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>
              )}
            </div>
          </div>
        )}

        {/* STEP: CART */}
        {step === 'cart' && (
          <div className="animate-fade-in">
            <h2 className="font-bold text-lg mb-4">Sua Sacola</h2>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Sua sacola está vazia</p>
                <button onClick={() => setStep('browse')} className="text-primary font-semibold text-sm mt-2 hover:underline">
                  Ver cardápio
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 animate-slide-in">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-primary font-semibold">{fmt(item.product.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-all">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-all">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => updateQty(item.product.id, 0)} className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-all ml-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Distance selector */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pos-delivery" />
                    <span className="text-sm font-semibold">Distância para entrega</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={deliveryTiers.length > 0 ? Math.max(...deliveryTiers.map(t => t.toKm)) : 10}
                      step={0.5}
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-bold tabular-nums w-16 text-right">{distanceKm} km</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de entrega: <span className="font-semibold text-foreground">{fmt(deliveryFee)}</span>
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Entrega</span>
                    <span className="tabular-nums">{fmt(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary tabular-nums">{fmt(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  Continuar — {fmt(total)}
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP: CHECKOUT */}
        {step === 'checkout' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-bold text-lg">Dados para Entrega</h2>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Seu nome *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="WhatsApp / Telefone *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  placeholder="Endereço completo *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  placeholder="Observações (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="text-sm font-semibold mb-2">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(({ method, icon }) => (
                  <button
                    key={method}
                    onClick={() => setPayment(method)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                      payment === method
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    {icon}
                    {PAYMENT_LABELS[method]}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold mb-2">Resumo do Pedido</p>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}x {item.product.name}</span>
                  <span className="tabular-nums">{fmt(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                <span>Entrega ({distanceKm}km)</span>
                <span className="tabular-nums">{fmt(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Check className="h-5 w-5" />
              Enviar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
