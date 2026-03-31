import { usePosStore } from '@/store/pos-store';
import { PAYMENT_LABELS } from '@/types/pos';
import { Receipt, TrendingUp } from 'lucide-react';

export default function Sales() {
  const { sales } = usePosStore();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const todaySales = sales.filter((s) => {
    const today = new Date();
    const saleDate = new Date(s.createdAt);
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Vendas</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-5 animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Vendas Hoje</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{todaySales.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-pos-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-pos-success" />
            </div>
            <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-pos-success">{formatCurrency(todayRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Total Geral</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Sales list */}
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-5 py-3 font-semibold">Data</th>
              <th className="text-left px-5 py-3 font-semibold">Itens</th>
              <th className="text-left px-5 py-3 font-semibold">Pagamento</th>
              <th className="text-center px-5 py-3 font-semibold">Delivery</th>
              <th className="text-right px-5 py-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhuma venda registrada
                </td>
              </tr>
            ) : (
              sales.map((sale, i) => (
                <tr key={sale.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3">
                    {sale.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                  </td>
                  <td className="px-5 py-3">
                    {sale.payments.map((p) => PAYMENT_LABELS[p.method]).join(', ')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {sale.isDelivery ? (
                      <span className="px-2 py-0.5 rounded-full bg-pos-delivery/10 text-pos-delivery text-xs font-semibold">Sim</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-primary">
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
