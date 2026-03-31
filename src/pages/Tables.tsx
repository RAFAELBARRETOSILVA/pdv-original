import { useMemo, useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { PAYMENT_LABELS, type PaymentMethod, type PendingOrder } from '@/types/pos';
import { printHtml } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Utensils,
  Receipt,
  Wallet,
  X,
  Users,
  Clock3,
  CheckCircle2,
} from 'lucide-react';

const NUM_MESAS = 10;

export default function Tables() {
  const {
    pendingOrders,
    markPendingOrderAsPaid,
    printerConfig,
    storeName,
  } = usePosStore();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isClosingTable, setIsClosingTable] = useState(false);

  const fmt = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const mesas = useMemo(() => {
    return Array.from({ length: NUM_MESAS }, (_, i) => {
      const numero = String(i + 1);

      const pedidosAbertos = pendingOrders.filter(
        (pedido) => pedido.orderType === 'mesa' && pedido.status === 'open' && pedido.tableNumber === numero,
      );

      const totalMesa = pedidosAbertos.reduce((sum, pedido) => sum + pedido.total, 0);
      const totalItens = pedidosAbertos.reduce(
        (sum, pedido) => sum + pedido.items.reduce((acc, item) => acc + item.quantity, 0),
        0,
      );

      return {
        numero,
        pedidos: pedidosAbertos,
        totalMesa,
        totalItens,
        ocupada: pedidosAbertos.length > 0,
      };
    });
  }, [pendingOrders]);

  const mesaSelecionada = useMemo(() => {
    if (!selectedTable) return null;
    return mesas.find((mesa) => mesa.numero === selectedTable) || null;
  }, [mesas, selectedTable]);

  const totalMesaSelecionada = mesaSelecionada?.totalMesa || 0;

  const buildPaymentReceiptHtml = (
    mesa: string,
    pedidos: PendingOrder[],
    metodo: PaymentMethod,
  ) => {
    const now = new Date();
    const itemsHtml = pedidos
      .flatMap((pedido) =>
        pedido.items.map(
          (item) => `
            <tr>
              <td style="padding: 3px 0;">${item.quantity}x ${item.product.name}</td>
              <td style="padding: 3px 0; text-align: right;">${fmt(item.product.price * item.quantity)}</td>
            </tr>
          `,
        ),
      )
      .join('');

    const subtotal = pedidos.reduce((sum, pedido) => sum + pedido.subtotal, 0);
    const taxaEntrega = pedidos.reduce((sum, pedido) => sum + pedido.deliveryFee, 0);
    const desconto = pedidos.reduce((sum, pedido) => sum + pedido.discount, 0);
    const total = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Pagamento Mesa ${mesa}</title>
          <style>
            @page { size: auto; margin: 0; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
              font-size: 12px;
              color: #000;
            }
            h1, h2, p { margin: 0; }
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
            .total {
              font-size: 15px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="section center">
            <h2>${storeName || 'PDV'}</h2>
            <p>COMPROVANTE DE PAGAMENTO</p>
            <p><strong>MESA ${mesa}</strong></p>
            <p>${now.toLocaleString('pt-BR')}</p>
          </div>

          <div class="section">
            <p><strong>Pedidos fechados:</strong> ${pedidos.length}</p>
            <p><strong>Forma de pagamento:</strong> ${PAYMENT_LABELS[metodo]}</p>
          </div>

          <div class="section">
            <table>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <p>Subtotal <span style="float:right">${fmt(subtotal)}</span></p>
            ${taxaEntrega > 0 ? `<p>Taxas <span style="float:right">${fmt(taxaEntrega)}</span></p>` : ''}
            ${desconto > 0 ? `<p>Desconto <span style="float:right">-${fmt(desconto)}</span></p>` : ''}
            <p class="total">TOTAL <span style="float:right">${fmt(total)}</span></p>
          </div>

          <div class="center">
            <p>Pagamento confirmado</p>
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleCloseTable = async () => {
    if (!mesaSelecionada || mesaSelecionada.pedidos.length === 0) {
      toast.error('Nenhum consumo aberto nesta mesa');
      return;
    }

    try {
      setIsClosingTable(true);

      for (const pedido of mesaSelecionada.pedidos) {
        markPendingOrderAsPaid(
          pedido.id,
          [{ method: paymentMethod, amount: pedido.total }],
          {
            paymentMethod,
            customerName: pedido.customerName,
          },
        );
      }

      const receiptHtml = buildPaymentReceiptHtml(
        mesaSelecionada.numero,
        mesaSelecionada.pedidos,
        paymentMethod,
      );

      await printHtml(receiptHtml, printerConfig, 'main');

      toast.success(`Mesa ${mesaSelecionada.numero} fechada com sucesso`);
      setSelectedTable(null);
      setPaymentMethod('cash');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fechar a mesa');
    } finally {
      setIsClosingTable(false);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Abra a mesa para visualizar o consumo e cobrar somente no fechamento
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Livre
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Clock3 className="h-3.5 w-3.5" />
            Ocupada
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesas.map((mesa) => (
          <button
            key={mesa.numero}
            type="button"
            onClick={() => setSelectedTable(mesa.numero)}
            className={`text-left border rounded-2xl p-4 transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
              mesa.ocupada
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    mesa.ocupada
                      ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-lg leading-none">Mesa {mesa.numero}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {mesa.ocupada ? 'Com consumo em aberto' : 'Disponível'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pedidos</span>
                <span className="font-semibold">{mesa.pedidos.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span className="font-semibold">{mesa.totalItens}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="font-semibold">Consumo</span>
                <span className="font-bold text-primary">{fmt(mesa.totalMesa)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {mesaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-xl font-black">Mesa {mesaSelecionada.numero}</h2>
                <p className="text-sm text-muted-foreground">
                  {mesaSelecionada.pedidos.length} pedido(s) em aberto
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-88px)]">
              {mesaSelecionada.pedidos.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Users className="h-14 w-14 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Mesa sem consumo aberto</p>
                  <p className="text-sm">Quando houver pedidos lançados nesta mesa, eles aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {mesaSelecionada.pedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-secondary/20 border-b border-border flex items-center justify-between">
                        <div>
                          <p className="font-bold">{pedido.ticketLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 text-xs font-bold">
                          EM ABERTO
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        {pedido.items.map((item, index) => (
                          <div
                            key={`${pedido.id}-${item.product.id}-${index}`}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.product.name}
                              </p>
                              {item.observations && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Obs: {item.observations}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold tabular-nums">
                              {fmt(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}

                        {pedido.notes && (
                          <div className="pt-2 border-t border-border/60">
                            <p className="text-xs text-muted-foreground">
                              <strong>Observação do pedido:</strong> {pedido.notes}
                            </p>
                          </div>
                        )}

                        <div className="pt-3 mt-3 border-t border-border/60 space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{fmt(pedido.subtotal)}</span>
                          </div>

                          {pedido.deliveryFee > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Taxas</span>
                              <span>{fmt(pedido.deliveryFee)}</span>
                            </div>
                          )}

                          {pedido.discount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Desconto</span>
                              <span>- {fmt(pedido.discount)}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between font-bold text-base pt-2">
                            <span>Total</span>
                            <span className="text-primary">{fmt(pedido.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-border bg-secondary/10 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="h-5 w-5 text-primary" />
                      <h3 className="font-bold">Fechamento da Mesa</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Forma de pagamento
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="cash">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="credit">Crédito</option>
                          <option value="debit">Débito</option>
                          <option value="online">Online</option>
                        </select>
                      </div>

                      <div className="rounded-2xl bg-card border border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground">Total da mesa</p>
                        <p className="text-2xl font-black text-primary">
                          {fmt(totalMesaSelecionada)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCloseTable}
                        disabled={isClosingTable || mesaSelecionada.pedidos.length === 0}
                        className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        {isClosingTable ? 'FECHANDO MESA...' : 'COBRAR E FECHAR MESA'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTable(null)}
                        className="md:w-44 py-3.5 rounded-2xl border border-border bg-card font-semibold hover:bg-secondary transition-colors"
                      >
                        Fechar Janela
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Ao confirmar o pagamento, os pedidos da mesa serão marcados como pagos e o comprovante será impresso na impressora principal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}