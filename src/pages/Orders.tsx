import { usePosStore } from '@/store/pos-store';
import { OrderStatus, ORDER_STATUS_LABELS, PAYMENT_LABELS } from '@/types/pos';
import { Clock, ChefHat, Truck, CheckCircle2, XCircle, Package } from 'lucide-react';

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; colorClass: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, colorClass: 'bg-pos-warning/10 text-pos-warning border-pos-warning/20' },
  preparing: { icon: <ChefHat className="h-4 w-4" />, colorClass: 'bg-pos-pix/10 text-pos-pix border-pos-pix/20' },
  delivering: { icon: <Truck className="h-4 w-4" />, colorClass: 'bg-pos-card-pay/10 text-pos-card-pay border-pos-card-pay/20' },
  delivered: { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: 'bg-pos-success/10 text-pos-success border-pos-success/20' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, colorClass: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'delivering', 'delivered'];

export default function Orders() {
  const { onlineOrders, updateOrderStatus } = usePosStore();
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const pendingCount = onlineOrders.filter((o) => o.status === 'pending').length;

  const advanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < STATUS_FLOW.length - 1) {
      updateOrderStatus(orderId, STATUS_FLOW[idx + 1]);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pedidos Online</h1>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? (
              <span className="text-pos-warning font-semibold">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
            ) : (
              'Nenhum pedido pendente'
            )}
          </p>
        </div>
      </div>

      {onlineOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum pedido ainda</p>
          <p className="text-sm">Os pedidos do cardápio online aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {onlineOrders.map((order, i) => {
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
                  <div>
                    <p className="font-bold text-sm">#{order.id.slice(0, 6).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </p>
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Entrega ({order.distanceKm}km)</span>
                    <span className="tabular-nums">{fmt(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Total ({PAYMENT_LABELS[order.paymentMethod]})</span>
                    <span className="text-primary tabular-nums">{fmt(order.total)}</span>
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
