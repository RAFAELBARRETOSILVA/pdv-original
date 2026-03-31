import { useEffect, useMemo, useState } from 'react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { usePosStore } from '@/store/pos-store';
import { fetchCep, formatCep, printHtml } from '@/lib/utils';
import type { OrderType } from '@/types/pos';
import {
  DollarSign,
  LogIn,
  LogOut,
  ShoppingCart,
  Utensils,
  Truck,
  User,
  X,
  Store,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';

type AddressForm = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
};

const initialAddress: AddressForm = {
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  complement: '',
};

export default function POS() {
  const {
    cashRegister,
    storeName,
    printerConfig,
    cart,
    pendingOrders,
    openCashRegister,
    closeCashRegister,
    getCashRegisterSummary,
    addPendingOrder,
    getTotal,
  } = usePosStore();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>('balcao');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressForm>(initialAddress);
  const [notes, setNotes] = useState('');

  const [openingAmount, setOpeningAmount] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [closingAmount, setClosingAmount] = useState('');

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartTotal = getTotal();

  const openOrdersCount = pendingOrders.filter((order) => order.status === 'open').length;

  useEffect(() => {
    const runCepLookup = async () => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) return;

      const data = await fetchCep(cleanCep);
      if (!data) {
        toast.error('CEP não encontrado');
        return;
      }

      setAddress((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        complement: data.complemento || prev.complement,
      }));

      toast.success('Endereço localizado!');
    };

    runCepLookup();
  }, [cep]);

  const resetOrderForm = () => {
    setOrderType('balcao');
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setCep('');
    setAddress(initialAddress);
    setNotes('');
  };

  const buildKitchenTicketHtml = (ticketLabel: string, createdAt: Date) => {
    const itemsHtml = cart
      .map(
        (item) => `
          <div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #000;">
            <div style="font-size:16px; font-weight:bold;">
              ${item.quantity}x ${item.product.name}
            </div>
            ${
              item.observations
                ? `<div style="font-size:12px; margin-top:4px;">OBS: ${item.observations}</div>`
                : ''
            }
          </div>
        `,
      )
      .join('');

    const orderInfo =
      orderType === 'mesa'
        ? `Mesa ${tableNumber}`
        : orderType === 'delivery'
          ? `Delivery - ${customerName}`
          : orderType === 'retirada'
            ? `Retirada - ${customerName}`
            : `Balcão - ${customerName || 'Cliente'}`;

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Cozinha ${ticketLabel}</title>
          <style>
            @page { size: auto; margin: 0; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              font-size: 13px;
            }
            .center { text-align: center; }
            .section {
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="section center">
            <div style="font-size:20px; font-weight:bold;">COZINHA</div>
            <div style="font-size:18px; font-weight:bold; margin-top:4px;">${ticketLabel}</div>
            <div style="margin-top:4px;">${createdAt.toLocaleString('pt-BR')}</div>
          </div>

          <div class="section">
            <div><strong>${orderInfo}</strong></div>
            ${
              notes
                ? `<div style="margin-top:6px;"><strong>Obs. pedido:</strong> ${notes}</div>`
                : ''
            }
          </div>

          <div class="section">
            ${itemsHtml}
          </div>

          <div class="center" style="font-size:12px; font-weight:bold;">
            FAVOR PREPARAR ESTE PEDIDO
          </div>
        </body>
      </html>
    `;
  };

  const buildCashierOrderTicketHtml = (
    ticketLabel: string,
    createdAt: Date,
    total: number,
  ) => {
    const itemsHtml = cart
      .map(
        (item) => `
          <tr>
            <td style="padding:3px 0;">${item.quantity}x ${item.product.name}</td>
            <td style="padding:3px 0; text-align:right;">${fmt(item.product.price * item.quantity)}</td>
          </tr>
        `,
      )
      .join('');

    const typeLabel =
      orderType === 'mesa'
        ? 'Mesa'
        : orderType === 'delivery'
          ? 'Delivery'
          : orderType === 'retirada'
            ? 'Retirada'
            : 'Balcão';

    const addressLine =
      orderType === 'delivery'
        ? `
          <div style="margin-top:6px;">
            <strong>Endereço:</strong> ${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}
          </div>
          <div style="margin-top:2px;">
            <strong>Bairro:</strong> ${address.neighborhood}${address.city ? ` - ${address.city}` : ''}${address.state ? `/${address.state}` : ''}
          </div>
          ${cep ? `<div style="margin-top:2px;"><strong>CEP:</strong> ${cep}</div>` : ''}
        `
        : '';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Pedido ${ticketLabel}</title>
          <style>
            @page { size: auto; margin: 0; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              font-size: 12px;
            }
            .center { text-align: center; }
            .section {
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          <div class="section center">
            <div style="font-size:18px; font-weight:bold;">${storeName}</div>
            <div style="margin-top:4px;">COMANDA DO CAIXA</div>
            <div style="font-size:16px; font-weight:bold; margin-top:4px;">${ticketLabel}</div>
          </div>

          <div class="section">
            <div><strong>Data:</strong> ${createdAt.toLocaleString('pt-BR')}</div>
            <div><strong>Tipo:</strong> ${typeLabel}</div>
            ${
              orderType === 'mesa'
                ? `<div><strong>Mesa:</strong> ${tableNumber}</div>`
                : `<div><strong>Cliente:</strong> ${customerName || 'Cliente'}</div>`
            }
            ${customerPhone ? `<div><strong>Telefone:</strong> ${customerPhone}</div>` : ''}
            ${addressLine}
            ${notes ? `<div style="margin-top:6px;"><strong>Observação:</strong> ${notes}</div>` : ''}
          </div>

          <div class="section">
            <table>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div style="font-size:15px; font-weight:bold;">
              TOTAL <span style="float:right;">${fmt(total)}</span>
            </div>
          </div>

          <div class="center" style="font-size:11px;">
            Pedido lançado com sucesso
          </div>
        </body>
      </html>
    `;
  };

  const handleMakeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (orderType === 'mesa' && !tableNumber.trim()) {
      toast.error('Informe o número da mesa');
      return;
    }

    if ((orderType === 'balcao' || orderType === 'delivery' || orderType === 'retirada') && !customerName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }

    if (orderType === 'delivery') {
      if (!cep.trim()) {
        toast.error('Informe o CEP');
        return;
      }

      if (!address.street.trim() || !address.number.trim()) {
        toast.error('Informe endereço e número');
        return;
      }
    }

    const newOrder = addPendingOrder({
      orderType,
      customerName:
        orderType === 'mesa' ? `Mesa ${tableNumber.trim()}` : customerName.trim(),
      customerPhone: customerPhone.trim(),
      tableNumber: orderType === 'mesa' ? tableNumber.trim() : undefined,
      address:
        orderType === 'delivery'
          ? `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}`
          : undefined,
      neighborhood: orderType === 'delivery' ? address.neighborhood.trim() : undefined,
      complement: orderType === 'delivery' ? address.complement.trim() : undefined,
      cep: orderType === 'delivery' ? cep.trim() : undefined,
      notes: notes.trim(),
    });

    const createdAt = new Date();
    const kitchenHtml = buildKitchenTicketHtml(newOrder.ticketLabel, createdAt);
    const cashierHtml = buildCashierOrderTicketHtml(newOrder.ticketLabel, createdAt, newOrder.total);

    await printHtml(kitchenHtml, printerConfig, 'kitchen');
    setTimeout(() => {
      printHtml(cashierHtml, printerConfig, 'main');
    }, 500);

    toast.success(`${newOrder.ticketLabel} lançado com sucesso`);
    setShowOrderModal(false);
    resetOrderForm();
  };

  const handleCloseCashRegister = () => {
    if (!closingAmount) {
      toast.error('Informe o valor final em caixa');
      return;
    }

    closeCashRegister(Number(closingAmount));
    setShowCloseModal(false);
    setClosingAmount('');
    toast.success('Caixa fechado com sucesso');
  };

  if (!cashRegister) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-background p-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Caixa Fechado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Abra o caixa para começar a lançar pedidos, imprimir comanda da cozinha e comandas do caixa.
          </p>

          <button
            onClick={() => setShowOpenModal(true)}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Abrir Caixa
          </button>
        </div>

        {showOpenModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-border">
              <h2 className="text-xl font-bold mb-4">Iniciar Sessão de Caixa</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome do operador"
                  className="w-full p-3 rounded-lg border bg-background"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />

                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Valor inicial R$"
                  className="w-full p-3 rounded-lg border bg-background"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 py-3 rounded-xl border border-border font-semibold"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => {
                      if (!openingAmount) {
                        toast.error('Informe o valor inicial');
                        return;
                      }

                      openCashRegister(Number(openingAmount), operatorName.trim() || undefined);
                      setShowOpenModal(false);
                      setOpeningAmount('');
                      setOperatorName('');
                      toast.success('Caixa aberto com sucesso');
                    }}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const summary = getCashRegisterSummary();

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 p-4 animate-fade-in overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-green-500 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              CAIXA OPERANTE
            </span>

            <span className="text-xs text-muted-foreground hidden sm:block">|</span>

            <span className="text-xs font-medium text-primary flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              {openOrdersCount} pedido(s) em aberto
            </span>

            {summary && (
              <>
                <span className="text-xs text-muted-foreground hidden sm:block">|</span>
                <span className="text-xs text-muted-foreground">
                  Dinheiro esperado: <strong>{fmt(summary.expectedAmount)}</strong>
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowCloseModal(true)}
            className="text-destructive p-2 hover:bg-destructive/10 rounded-lg"
            title="Fechar caixa"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <ProductGrid />
        </div>
      </div>

      <div className="hidden md:flex w-[420px] flex-col bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-secondary/10 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Itens do Pedido
          </h2>
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
            {cartCount}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CartPanel hideControls />
        </div>

        <div className="p-4 border-t bg-card space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{fmt(cartTotal)}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowOrderModal(true)}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50"
          >
            FAZER PEDIDO
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            O pagamento será feito depois, no fechamento da mesa, delivery, retirada ou consumo do cliente.
          </p>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">DETALHES DO PEDIDO</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="h-10 w-10 rounded-xl border border-border flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <button
                onClick={() => setOrderType('balcao')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  orderType === 'balcao'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-secondary'
                }`}
              >
                <User size={20} />
                <span className="text-[10px] font-bold">BALCÃO</span>
              </button>

              <button
                onClick={() => setOrderType('mesa')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  orderType === 'mesa'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-secondary'
                }`}
              >
                <Utensils size={20} />
                <span className="text-[10px] font-bold">MESA</span>
              </button>

              <button
                onClick={() => setOrderType('delivery')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-secondary'
                }`}
              >
                <Truck size={20} />
                <span className="text-[10px] font-bold">DELIVERY</span>
              </button>

              <button
                onClick={() => setOrderType('retirada')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  orderType === 'retirada'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-secondary'
                }`}
              >
                <Store size={20} />
                <span className="text-[10px] font-bold">RETIRADA</span>
              </button>
            </div>

            <div className="space-y-4">
              {orderType === 'mesa' && (
                <input
                  type="number"
                  placeholder="Número da Mesa"
                  className="w-full p-4 rounded-xl border-2 focus:border-primary outline-none text-center text-2xl font-bold bg-background"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              )}

              {(orderType === 'balcao' || orderType === 'delivery' || orderType === 'retirada') && (
                <>
                  <input
                    placeholder="Nome do Cliente"
                    className="w-full p-3 rounded-lg border bg-background"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />

                  <input
                    placeholder="Telefone do Cliente"
                    className="w-full p-3 rounded-lg border bg-background"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </>
              )}

              {orderType === 'delivery' && (
                <div className="space-y-3 rounded-2xl border border-border p-4 bg-secondary/10">
                  <input
                    placeholder="CEP (busca automática)"
                    className="w-full p-3 rounded-lg border bg-background"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_110px] gap-2">
                    <input
                      placeholder="Rua"
                      className="w-full p-3 rounded-lg border bg-secondary/20"
                      value={address.street}
                      readOnly
                    />
                    <input
                      placeholder="Nº"
                      className="w-full p-3 rounded-lg border bg-background"
                      value={address.number}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, number: e.target.value }))
                      }
                    />
                  </div>

                  <input
                    placeholder="Bairro"
                    className="w-full p-3 rounded-lg border bg-secondary/20"
                    value={address.neighborhood}
                    readOnly
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      placeholder="Cidade"
                      className="w-full p-3 rounded-lg border bg-secondary/20"
                      value={address.city}
                      readOnly
                    />
                    <input
                      placeholder="Estado"
                      className="w-full p-3 rounded-lg border bg-secondary/20"
                      value={address.state}
                      readOnly
                    />
                  </div>

                  <input
                    placeholder="Complemento"
                    className="w-full p-3 rounded-lg border bg-background"
                    value={address.complement}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, complement: e.target.value }))
                    }
                  />
                </div>
              )}

              <textarea
                placeholder="Observações do pedido"
                className="w-full p-3 rounded-lg border bg-background min-h-[90px] resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="rounded-2xl bg-secondary/10 border border-border p-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total do pedido</span>
                  <span className="text-primary">{fmt(cartTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Neste momento o sistema apenas lança o pedido e imprime as comandas. A cobrança será feita depois.
                </p>
              </div>

              <button
                onClick={handleMakeOrder}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg"
              >
                CONFIRMAR E IMPRIMIR
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-2xl w-full max-w-md shadow-2xl border border-border">
            <h2 className="text-xl font-bold mb-4">Fechamento de Caixa</h2>

            {summary && (
              <div className="mb-4 rounded-xl border border-border bg-secondary/10 p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total de vendas</span>
                  <strong>{fmt(summary.totalSales)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quantidade de vendas</span>
                  <strong>{summary.salesCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dinheiro esperado</span>
                  <strong>{fmt(summary.expectedAmount)}</strong>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Valor final em caixa"
                className="w-full p-3 rounded-lg border bg-background"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-semibold"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleCloseCashRegister}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold"
                >
                  Fechar Caixa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}