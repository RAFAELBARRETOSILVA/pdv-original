import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { OrderStatus, ORDER_STATUS_LABELS, PAYMENT_LABELS, PIX_KEY_TYPE_LABELS } from '@/types/pos';
import { printHtml } from '@/lib/utils';
import { Clock, ChefHat, Truck, CheckCircle2, XCircle, Package, Printer, BadgeCheck, MessageCircle, Send, Filter } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; colorClass: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, colorClass: 'bg-pos-warning/10 text-pos-warning border-pos-warning/20' },
  preparing: { icon: <ChefHat className="h-4 w-4" />, colorClass: 'bg-pos-pix/10 text-pos-pix border-pos-pix/20' },
  delivering: { icon: <Truck className="h-4 w-4" />, colorClass: 'bg-pos-card-pay/10 text-pos-card-pay border-pos-card-pay/20' },
  delivered: { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: 'bg-pos-success/10 text-pos-success border-pos-success/20' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, colorClass: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'delivering', 'delivered'];

export default function Orders() {
  const { onlineOrders, updateOrderStatus, confirmPixPayment, pixConfig, printerConfig, storeName, products, storePhone } = usePosStore();
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const activeCount = onlineOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

  const filteredOrders = statusFilter === 'all'
    ? onlineOrders
    : onlineOrders.filter((o) => o.status === statusFilter);

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  const openWhatsApp = (phone: string, message: string) => {
    const clean = cleanPhone(phone);
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${num}?text=${encoded}`, '_blank');
  };

  const getWhatsAppStatusMessage = (orderId: string) => {
    const order = onlineOrders.find((o) => o.id === orderId);
    if (!order) return '';
    const itemsList = order.items.map((i) => `  ${i.quantity}x ${i.product.name}`).join('\n');
    const statusMessages: Record<OrderStatus, string> = {
      pending: `Olá ${order.customerName}! 👋\n\nRecebemos seu pedido #${order.id.slice(0, 6).toUpperCase()}:\n${itemsList}\n\nTotal: ${fmt(order.total)}\n\nAguardando confirmação. Obrigado! 🙏`,
      preparing: `Olá ${order.customerName}! 👨‍🍳\n\nSeu pedido #${order.id.slice(0, 6).toUpperCase()} está sendo *preparado*!\n\nJá já sai! 🔥`,
      delivering: `Olá ${order.customerName}! 🛵\n\nSeu pedido #${order.id.slice(0, 6).toUpperCase()} *saiu para entrega*!\n\nEndereço: ${order.address}\n\nChega em breve! 📦`,
      delivered: `Olá ${order.customerName}! ✅\n\nSeu pedido #${order.id.slice(0, 6).toUpperCase()} foi *entregue*!\n\nObrigado pela preferência! 😊\n\n_${storeName}_`,
      cancelled: `Olá ${order.customerName},\n\nInfelizmente seu pedido #${order.id.slice(0, 6).toUpperCase()} foi *cancelado*.\n\nEntre em contato para mais informações.`,
    };
    return statusMessages[order.status];
  };

  const handleSendCardapio = () => {
    const categories = [...new Set(products.map((p) => p.category))];
    let msg = `🍔 *CARDÁPIO - ${storeName}* 🍔\n\n`;
    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.category === cat);
      if (catProducts.length === 0) return;
      msg += `*━━ ${cat.toUpperCase()} ━━*\n`;
      catProducts.forEach((p) => {
        msg += `▸ ${p.name} — ${fmt(p.price)}${p.description ? `\n   _${p.description}_` : ''}\n`;
      });
      msg += '\n';
    });
    msg += `📞 Faça seu pedido!\n${storePhone ? `📱 ${storePhone}` : ''}\n\n_${storeName}_`;

    if (storePhone) {
      openWhatsApp(storePhone, msg);
    } else {
      // Copy to clipboard so operator can paste
      navigator.clipboard.writeText(msg).then(() => {
        toast.success('Cardápio copiado! Cole no WhatsApp para enviar');
      }).catch(() => {
        toast.error('Não foi possível copiar');
      });
    }
  };

  const advanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    const order = onlineOrders.find((o) => o.id === orderId);
    // Bloquear avanço se PIX não confirmado
    if (order?.paymentMethod === 'pix' && !order.pixPaymentConfirmed) {
      toast.error('Confirme o pagamento PIX antes de avançar o pedido');
      return;
    }
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < STATUS_FLOW.length - 1) {
      updateOrderStatus(orderId, STATUS_FLOW[idx + 1]);
      // After advancing, get the updated status message
      setTimeout(() => {
        const msg = getWhatsAppStatusMessage(orderId);
        if (order?.customerPhone && msg) {
          openWhatsApp(order.customerPhone, msg);
        }
      }, 100);
    }
  };

  const handleConfirmPix = (orderId: string) => {
    confirmPixPayment(orderId);
    toast.success('Pagamento PIX confirmado!');
  };

  const handlePrintComanda = (orderId: string) => {
    const order = onlineOrders.find((o) => o.id === orderId);
    if (!order) return;

    const itemsHtml = order.items.map((item) =>
      `<tr>
        <td style="padding:2px 0">${item.quantity}x ${item.product.name}</td>
        <td style="text-align:right;padding:2px 0">${fmt(item.product.price * item.quantity)}</td>
      </tr>`
    ).join('');

    const pixInfoHtml = order.paymentMethod === 'pix' && pixConfig ? `
      <div style="border:1px dashed #333;padding:8px;margin:8px 0;text-align:center">
        <p style="font-weight:bold;font-size:14px;margin:0 0 4px">💳 DADOS PIX</p>
        <p style="margin:2px 0;font-size:11px"><strong>Beneficiário:</strong> ${pixConfig.beneficiaryName}</p>
        <p style="margin:2px 0;font-size:11px"><strong>Chave (${PIX_KEY_TYPE_LABELS[pixConfig.pixKeyType]}):</strong></p>
        <p style="margin:2px 0;font-size:13px;font-weight:bold">${pixConfig.pixKey}</p>
        <p style="margin:2px 0;font-size:11px"><strong>Banco:</strong> ${pixConfig.bankName}</p>
        <p style="margin:6px 0 0;font-size:11px;color:#666">Valor: <strong>${fmt(order.total)}</strong></p>
      </div>
    ` : '';

    const pixStatusHtml = order.paymentMethod === 'pix' ? `
      <p style="text-align:center;font-size:12px;margin:4px 0;font-weight:bold;color:${order.pixPaymentConfirmed ? 'green' : 'red'}">
        ${order.pixPaymentConfirmed ? '✅ PIX CONFIRMADO' : '⏳ AGUARDANDO PAGAMENTO PIX'}
      </p>
    ` : '';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Comanda #${order.id.slice(0, 6).toUpperCase()}</title></head>
      <body style="font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:10px;font-size:12px">
        <div style="text-align:center;border-bottom:1px dashed #333;padding-bottom:8px;margin-bottom:8px">
          <h2 style="margin:0;font-size:16px">${storeName}</h2>
          <p style="margin:4px 0;font-size:11px">COMANDA DE PEDIDO</p>
        </div>

        <div style="border-bottom:1px dashed #333;padding-bottom:8px;margin-bottom:8px">
          <p style="margin:2px 0"><strong>Pedido:</strong> #${order.id.slice(0, 6).toUpperCase()}</p>
          <p style="margin:2px 0"><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
          <p style="margin:2px 0"><strong>Cliente:</strong> ${order.customerName}</p>
          <p style="margin:2px 0"><strong>Fone:</strong> ${order.customerPhone}</p>
          <p style="margin:2px 0"><strong>Tipo:</strong> ${order.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}</p>
          ${order.deliveryType === 'delivery' ? `<p style="margin:2px 0"><strong>Endereço:</strong> ${order.address}</p>` : ''}
          ${order.notes ? `<p style="margin:2px 0"><strong>Obs:</strong> ${order.notes}</p>` : ''}
        </div>

        <table style="width:100%;border-collapse:collapse;border-bottom:1px dashed #333;padding-bottom:8px;margin-bottom:8px">
          <thead>
            <tr style="border-bottom:1px solid #333">
              <th style="text-align:left;padding:2px 0">Item</th>
              <th style="text-align:right;padding:2px 0">Valor</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="border-bottom:1px dashed #333;padding-bottom:8px;margin-bottom:8px">
          <p style="margin:2px 0">Subtotal: <span style="float:right">${fmt(order.subtotal)}</span></p>
          ${order.deliveryFee > 0 ? `<p style="margin:2px 0">Entrega (${order.distanceKm}km): <span style="float:right">${fmt(order.deliveryFee)}</span></p>` : ''}
          <p style="margin:4px 0;font-size:14px;font-weight:bold">TOTAL: <span style="float:right">${fmt(order.total)}</span></p>
          <p style="margin:2px 0">Pagamento: <strong>${PAYMENT_LABELS[order.paymentMethod]}</strong></p>
        </div>

        ${pixInfoHtml}
        ${pixStatusHtml}

        <p style="text-align:center;font-size:10px;color:#666;margin-top:12px">Obrigado pela preferência!</p>
      </body>
      </html>
    `;
    printHtml(fullHtml, printerConfig);
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm">
            {activeCount > 0 ? (
              <span className="text-pos-warning font-semibold">{activeCount} ativo{activeCount > 1 ? 's' : ''}</span>
            ) : (
              'Nenhum pedido ativo'
            )}
          </p>
        </div>
        <button
          onClick={handleSendCardapio}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm active:scale-95 transition-all shadow-md"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Enviar Cardápio</span>
          <span className="sm:hidden">Cardápio</span>
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 pos-scrollbar">
        {(['all', 'pending', 'preparing', 'delivering', 'delivered', 'cancelled'] as const).map((status) => {
          const count = status === 'all' ? onlineOrders.length : onlineOrders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border'
              }`}
            >
              {status === 'all' ? 'Todos' : ORDER_STATUS_LABELS[status]} ({count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum pedido</p>
          <p className="text-sm">Pedidos criados pelo caixa ou cardápio online aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order, i) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const canAdvance = STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && order.status !== 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-card border border-border rounded-2xl overflow-hidden animate-slide-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Order header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-bold text-sm">#{order.id.slice(0, 6).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (order as any).source === 'manual'
                        ? 'bg-pos-delivery/10 text-pos-delivery'
                        : 'bg-pos-card-pay/10 text-pos-card-pay'
                    }`}>
                      {(order as any).source === 'manual' ? 'Manual' : 'Online'}
                    </span>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.colorClass}`}>
                    {statusConfig.icon}
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                {/* Customer info */}
                <div className="px-5 py-3 border-b border-border/50 bg-secondary/20">
                  <p className="text-sm font-semibold">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.address}</p>
                  {order.notes && (
                    <p className="text-xs text-pos-warning mt-1 italic">📝 {order.notes}</p>
                  )}
                </div>

                {/* Items */}
                <div className="px-5 py-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="tabular-nums text-muted-foreground">{fmt(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals + Actions */}
                <div className="px-5 py-4 border-t border-border bg-secondary/10 space-y-2">
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Entrega{order.distanceKm > 0 ? ` (${order.distanceKm}km)` : ''}</span>
                      <span className="tabular-nums">{fmt(order.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Total ({PAYMENT_LABELS[order.paymentMethod]})</span>
                    <span className="text-primary tabular-nums">{fmt(order.total)}</span>
                  </div>

                  {/* PIX payment confirmation */}
                  {order.paymentMethod === 'pix' && (
                    <div className="pt-1">
                      {order.pixPaymentConfirmed ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-500 bg-green-500/10 rounded-lg px-3 py-2">
                          <BadgeCheck className="h-4 w-4" />
                          PIX Confirmado
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmPix(order.id)}
                          className="w-full py-2 rounded-xl bg-[#00D4FF] text-white font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                        >
                          <BadgeCheck className="h-4 w-4" />
                          Confirmar Pagamento PIX
                        </button>
                      )}
                    </div>
                  )}

                  {/* WhatsApp + Print buttons */}
                  <div className="flex gap-2 pt-1">
                    {order.customerPhone && (
                      <button
                        onClick={() => openWhatsApp(order.customerPhone, getWhatsAppStatusMessage(order.id))}
                        className="flex-1 py-2 rounded-xl bg-[#25D366] text-white font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintComanda(order.id)}
                      className="flex-1 py-2 rounded-xl border border-border bg-card text-foreground font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 hover:bg-secondary"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </button>
                  </div>

                  {canAdvance && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => advanceStatus(order.id, order.status)}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-all shadow-sm"
                      >
                        {order.status === 'pending' && '👨‍🍳 Preparar'}
                        {order.status === 'preparing' && '🛵 Saiu p/ Entrega'}
                        {order.status === 'delivering' && '✅ Entregue'}
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive font-semibold text-sm active:scale-[0.97] transition-all hover:bg-destructive/5"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
