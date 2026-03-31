import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, ClipboardList, Users, Settings, Table } from 'lucide-react';
import { usePosStore } from '@/store/pos-store';
const NAV_ITEMS = [
  { to: '/', icon: ShoppingCart, label: 'Caixa' },
  { to: '/tables', icon: Table, label: 'Mesas' },
  { to: '/products', icon: Package, label: 'Produtos' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/orders', icon: ClipboardList, label: 'Pedidos' },
  { to: '/sales', icon: BarChart3, label: 'Vendas' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function Sidebar() {
  const { onlineOrders, storeLogo } = usePosStore();
  const pendingCount = onlineOrders.filter((o) => o.status === 'pending').length;

  return (
    <>
      {/* Desktop: sidebar lateral */}
      <aside className="hidden md:flex w-[72px] bg-pos-sidebar flex-col items-center py-6 gap-1 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg mb-8 overflow-hidden">
          {storeLogo ? (
            <img src={storeLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            'P'
          )}
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

      {/* Mobile: bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-pos-sidebar border-t border-white/10 flex items-center justify-around px-1 py-1 z-50 safe-bottom">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-pos-sidebar-foreground/50'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-medium">{label}</span>
            {to === '/orders' && pendingCount > 0 && (
              <span className="absolute -top-0.5 right-0 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
