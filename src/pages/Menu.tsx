import { useState, useEffect, useCallback } from 'react';
import { usePosStore } from '@/store/pos-store';
import { CartItem, Product, PaymentMethod, PAYMENT_LABELS, CATEGORIES } from '@/types/pos';
import { Minus, Plus, ShoppingBag, Trash2, MapPin, Phone, User, MessageSquare, Smartphone, CreditCard, Banknote, ChevronLeft, Check, Truck, Search, LogOut, Home } from 'lucide-react';
import { toast } from 'sonner';
import { fetchCep, formatCep } from '@/lib/utils';

type MenuStep = 'login' | 'browse' | 'cart' | 'checkout';

export default function Menu() {
  const { products, deliveryTiers, storeName, storeLogo, storePhone, storeAddress, storeCep, storeCity, storeLatitude, storeLongitude, enabledPaymentMethods, getDeliveryFeeByKm, addOnlineOrder, findCustomerByEmail, findCustomerByPhone, addCustomer, getCurrentCustomer, setCurrentCustomer, updateCustomerStats } = usePosStore();
  const [step, setStep] = useState<MenuStep>('login');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  // Login/register fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Checkout fields
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('pix');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Haversine distance calculation
  const haversineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Auto-calculate distance from store to customer via geolocation
  const calculateDistance = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo seu navegador');
      return;
    }
    if (!storeLatitude || !storeLongitude) {
      return;
    }
    setCalculatingDistance(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = haversineDistance(storeLatitude, storeLongitude, position.coords.latitude, position.coords.longitude);
        setDistanceKm(Math.round(dist * 10) / 10);
        setCalculatingDistance(false);
      },
      () => {
        toast.error('Não foi possível obter sua localização. Verifique as permissões.');
        setCalculatingDistance(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [storeLatitude, storeLongitude, haversineDistance]);

  // Calculate distance when delivery type is selected and user is logged in
  useEffect(() => {
    if (deliveryType === 'delivery' && step !== 'login') {
      calculateDistance();
    }
  }, [deliveryType, step, calculateDistance]);

  const currentCustomer = getCurrentCustomer();
  const deliveryFee = deliveryType === 'delivery' ? getDeliveryFeeByKm(distanceKm) : 0;
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const handleLogin = () => {
    if (!email || !phone) {
      toast.error('Preencha email e telefone');
      return;
    }

    let customer = findCustomerByEmail(email);
    if (!customer) {
      customer = findCustomerByPhone(phone);
    }

    if (customer) {
      setCurrentCustomer(customer.id);
      setName(customer.name);
      setCep(customer.cep || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || '');
      setNeighborhood(customer.neighborhood || '');
      toast.success(`Bem-vindo, ${customer.name}! 👋`);
      setStep('browse');
    } else {
      toast.error('Cliente não encontrado. Preencha todos os dados para se cadastrar.');
    }
  };

  const handleRegister = () => {
    if (!email || !phone || !name) {
      toast.error('Preencha email, telefone e nome');
      return;
    }

    let existingCustomer = findCustomerByEmail(email);
    if (existingCustomer) {
      toast.error('Email já cadastrado');
      return;
    }

    const newCustomer = addCustomer({
      name,
      email,
      phone,
      cep,
      address,
      city,
      state,
      neighborhood,
    });

    const createdCustomer = findCustomerByEmail(email);
    if (createdCustomer) {
      setCurrentCustomer(createdCustomer.id);
      toast.success(`${name}, bem-vindo! 🎉`);
      setStep('browse');
    }
  };

  const handleLogout = () => {
    setCurrentCustomer(undefined);
    setEmail('');
    setPhone('');
    setName('');
    setCep('');
    setAddress('');
    setCity('');
    setState('');
    setNeighborhood('');
    setCart([]);
    setStep('login');
    toast.success('Desconectado com sucesso');
  };

  const addToCart = (product: Product) => {
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
      customerId: currentCustomer?.id,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      address,
      distanceKm: deliveryType === 'delivery' ? distanceKm : 0,
      deliveryType,
      items: cart,
      deliveryFee,
      subtotal,
      total,
      paymentMethod: payment,
      notes,
    });

    // Update customer stats
    if (currentCustomer) {
      updateCustomerStats(currentCustomer.id, total);
    }

    toast.success('Pedido enviado com sucesso! 🎉');
    setCart([]);
    setNotes('');
    setStep('browse');
  };

  const ALL_PAYMENT_OPTIONS: { method: PaymentMethod; icon: React.ReactNode }[] = [
    { method: 'pix', icon: <Smartphone className="h-4 w-4" /> },
    { method: 'credit', icon: <CreditCard className="h-4 w-4" /> },
    { method: 'debit', icon: <CreditCard className="h-4 w-4" /> },
    { method: 'cash', icon: <Banknote className="h-4 w-4" /> },
  ];

  // Filtrar apenas métodos habilitados
  const PAYMENT_OPTIONS = ALL_PAYMENT_OPTIONS.filter(({ method }) => enabledPaymentMethods.includes(method));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {step !== 'login' && step !== 'browse' ? (
            <button onClick={() => setStep(step === 'checkout' ? 'cart' : 'browse')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {storeLogo && (
                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/50">
                  <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg leading-tight">{storeName}</h1>
                <p className="text-xs text-muted-foreground">Cardápio Online</p>
              </div>
            </div>
          )}
          {step === 'browse' && (
            <div className="flex gap-2">
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
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          {step === 'checkout' && (
            <p className="font-semibold text-sm">Finalizar Pedido</p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* STEP: LOGIN */}
        {step === 'login' && (
          <div className="animate-fade-in space-y-6 py-8">
            <div className="text-center mb-8">
              {storeLogo && (
                <div className="h-20 w-20 mx-auto mb-4 rounded-xl overflow-hidden bg-secondary/50">
                  <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
                </div>
              )}
              <h2 className="font-bold text-2xl mb-2">{storeName}</h2>
              <p className="text-muted-foreground">Faça login ou crie sua conta para continuar</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">Fazer Login</h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-all"
              >
                Entrar
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">Criar Conta</h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={cep}
                      onChange={async (e) => {
                        const formatted = formatCep(e.target.value);
                        setCep(formatted);
                        if (formatted.replace(/\D/g, '').length === 8) {
                          const data = await fetchCep(formatted);
                          if (data) {
                            setAddress(data.logradouro || '');
                            setNeighborhood(data.bairro || '');
                            toast.success('Endereço encontrado!');
                          }
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    placeholder="Endereço (rua, número)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
              <button
                onClick={handleRegister}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-all"
              >
                Criar Conta
              </button>
            </div>
          </div>
        )}
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

            {/* Store info banner */}
            {(storePhone || storeAddress) && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-5 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  {storeAddress && (
                    <p>
                      <span className="font-semibold">Endereço:</span> {storeAddress}
                      {storeCity && `, ${storeCity}`}
                    </p>
                  )}
                  {storePhone && (
                    <p>
                      <span className="font-semibold">Whatsapp:</span>{' '}
                      <a href={`https://wa.me/55${storePhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {storePhone}
                      </a>
                    </p>
                  )}
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
            <h2 className="font-bold text-lg">Dados para Pedido</h2>

            {/* Delivery type */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                  deliveryType === 'delivery'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Truck className="h-4 w-4 mx-auto mb-1" />
                Entrega
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                  deliveryType === 'pickup'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Home className="h-4 w-4 mx-auto mb-1" />
                Retirar na loja
              </button>
            </div>

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
              {deliveryType === 'delivery' && (
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
              )}
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
              {deliveryType === 'delivery' && (
                <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                  <span>Entrega</span>
                  <span className="tabular-nums">{calculatingDistance ? 'Calculando...' : fmt(deliveryFee)}</span>
                </div>
              )}
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
