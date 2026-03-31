import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { usePosStore } from "@/store/pos-store";

import Index from "./pages/Index";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import Tables from "./pages/Tables";

const queryClient = new QueryClient();

function AppTitleUpdater() {
  const storeName = usePosStore((s) => s.storeName);
  const storeLogo = usePosStore((s) => s.storeLogo);

  useEffect(() => {
    document.title = `${storeName} - PDV`;

    // Atualizar favicon com logo da loja
    if (storeLogo) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = storeLogo;
    }
  }, [storeName, storeLogo]);

  // Backup automático ao iniciar o app
  useEffect(() => {
    const doAutoBackup = async () => {
      if (!window.electronAPI?.backup) return;
      try {
        const raw = localStorage.getItem('pos-storage');
        if (raw) {
          const data = JSON.parse(raw);
          await window.electronAPI.backup.autoSave(data);
          console.log('[Backup] Backup automático salvo com sucesso');
        }
      } catch (err) {
        console.error('[Backup] Erro no backup automático:', err);
      }
    };
    doAutoBackup();
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppTitleUpdater />
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="sales" element={<Sales />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* Public online menu */}
          <Route path="/menu" element={<Menu />} />

          <Route path="tables" element={<Tables />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
