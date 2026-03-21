import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, ClipboardList, Settings } from 'lucide-react';
import { usePosStore } from '@/store/pos-store';

const NAV_ITEMS = [
  { to: '/', icon: ShoppingCart, label: 'Caixa' },
  { to: '/products', icon: Package, label: 'Produtos' },
  { to: '/orders', icon: ClipboardList, label: 'Pedidos' },
  { to: '/sales', icon: BarChart3, label: 'Vendas' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function Sidebar() {
  const { onlineOrders } = usePosStore();
  const pendingCount = onlineOrders.filter((o) => o.status === 'pending').length;

  return (
    <aside className="w-[72px] bg-pos-sidebar flex flex-col items-center py-6 gap-1 shrink-0">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg mb-8">
        P
      </div>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all w-14 ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-pos-sidebar-foreground/50 hover:text-pos-sidebar-foreground/80 hover:bg-white/5'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{label}</span>
          {to === '/orders' && pendingCount > 0 && (
            <span className="absolute top-1.5 right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center animate-scale-in">
              {pendingCount}
            </span>
          )}
        </NavLink>
      ))}
    </aside>
  );
}
