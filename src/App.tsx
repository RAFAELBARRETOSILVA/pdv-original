import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* POS Dashboard */}
          <Route path="/" element={<Index />}>
            <Route index element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="sales" element={<Sales />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* Public online menu */}
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
