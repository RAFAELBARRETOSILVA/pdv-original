import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { PaymentMethod, PAYMENT_LABELS, PIX_KEY_TYPE_LABELS, OnlineOrder } from '@/types/pos';
import { Minus, Plus, Trash2, Truck, Tag, CreditCard, Smartphone, Banknote, Globe, X, Check, Printer, Search, Utensils, Store } from 'lucide-react';
import { toast } from 'sonner';
import { printHtml, fetchCep, formatCep } from '@/lib/utils';

export function CartPanel({ onFinalize }: { onFinalize?: () => void }) {
  const {
    cart, deliveryFee, discount, isDelivery,
    removeFromCart, updateCartQuantity, clearCart,
    setDeliveryFee, setDiscount, setIsDelivery,
    getSubtotal, getTotal, finalizeSale,
    addPendingOrder, findCustomerByPhone,
    pixConfig, storeName, printerConfig,
  } = usePosStore();

  const [showPayment, setShowPayment] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  
  // Novos estados para o fluxo de pedido aberto
  const [orderType, setOrderType] = useState<'balcao' | 'mesa' | 'delivery'>('balcao');
  const [identifier, setIdentifier] = useState(''); // Nº Mesa ou Nome Cliente

  // Delivery info
  const [deliveryCep, setDeliveryCep] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');

  const subtotal = getSubtotal();
  const total = getTotal();

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  // FUNÇÃO PARA IMPRIMIR NA COZINHA (Sem valores)
  const printKitchenTicket = (order: OnlineOrder) => {
    const html = `
      <div style="font-family:'Courier New', monospace; width:270px; padding:5px">
        <div style="text-align:center; border-bottom:2px solid #000; margin-bottom:10px">
          <h2 style="margin:0">COZINHA</h2>
          <h1 style="margin:5px 0">#${order.orderNumber}</h1>
          <p style="font-weight:bold; font-size:16px">${order.deliveryType === 'table' ? 'MESA: ' + order.customerName : order.customerName}</p>
        </div>
        <table style="width:100%; font-size:14px">
          ${order.items.map(item => `
            <tr>
              <td style="padding:5px 0"><b>${item.quantity}x</b> ${item.product.name}</td>
            </tr>
            ${item.product.description ? `<tr><td style="font-size:11px; padding-bottom:5px">>> OBS: ${item.product.description}</td></tr>` : ''}
          `).join('')}
        </table>
        <div style="border-top:1px dashed #000; margin-top:10px; text-align:center">
          <p>${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>
    `;
    // Imprime na impressora de cozinha se existir, senão na padrão
    printHtml(html, { 
      printerName: printerConfig?.kitchenPrinterName || printerConfig?.printerName || '', 
      autoPrint: true, 
      paperWidth: printerConfig?.paperWidth 
    });
  };

  // FUNÇÃO PARA IMPRIMIR CUPOM DO CAIXA (Conferência)
  const printCheckTicket = (order: OnlineOrder) => {
    const html = `
      <div style="font-family:'Courier New', monospace; width:270px; padding:5px">
        <div style="text-align:center; border-bottom:1px solid #000">
          <h2 style="margin:0">${storeName}</h2>
          <p>CONFERÊNCIA - PEDIDO #${order.orderNumber}</p>
        </div>
        <div style="padding:10px 0">
          <p><b>Cliente/Mesa:</b> ${order.customerName}</p>
          <p><b>Data:</b> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <table style="width:100%; border-bottom:1px dashed #000">
          ${order.items.map(item => `
            <tr>
              <td>${item.quantity}x ${item.product.name}</td>
              <td style="text-align:right">${formatCurrency(item.product.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </table>
        <div style="padding-top:5px; font-weight:bold">
          <p>SUBTOTAL: <span style="float:right">${formatCurrency(order.subtotal)}</span></p>
          ${order.deliveryFee > 0 ? `<p>ENTREGA: <span style="float:right">${formatCurrency(order.deliveryFee)}</span></p>` : ''}
          <p style="font-size:16px">TOTAL: <span style="float:right">${formatCurrency(order.total)}</span></p>
        </div>
      </div>
    `;
    printHtml(html, printerConfig);
  };

  const handleLaunchOrder = async () => {
    if (cart.length === 0) return toast.error('Adicione itens ao carrinho');
    if (!identifier) return toast.error('Informe a Mesa ou o Nome do Cliente');

    const orderData: Partial<OnlineOrder> = {
      customerName: identifier,
      deliveryType: orderType === 'mesa' ? 'table' : (orderType === 'delivery' ? 'delivery' : 'pickup'),
      address: deliveryAddress || 'BALCÃO',
      neighborhood: deliveryNeighborhood,
      source: 'manual',
    };

    const newOrder = addPendingOrder(orderData);
    
    // Imprime as duas vias
    printKitchenTicket(newOrder);
    printCheckTicket(newOrder);

    toast.success(`Pedido #${newOrder.orderNumber} enviado para cozinha!`);
    setIdentifier('');
    setDeliveryAddress('');
    setDeliveryCep('');
    onFinalize?.();
  };

  const handleCepSearch = async (val: string) => {
    const formatted = formatCep(val);
    setDeliveryCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      const data = await fetchCep(formatted);
      if (data) {
        setDeliveryAddress(data.logradouro);
        setDeliveryNeighborhood(data.bairro);
        toast.success('Endereço localizado!');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-secondary/10">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Novo Pedido</h2>
          <button onClick={clearCart} className="text-destructive text-xs hover:underline">Limpar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 py-2 border-b border-border/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.product.name}</p>
              <p className="text-xs text-primary font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded bg-secondary flex items-center justify-center">-</button>
              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
              <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded bg-secondary flex items-center justify-center">+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-border bg-secondary/5 space-y-4">
        {/* Seletor de Tipo de Pedido */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setOrderType('balcao')} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${orderType === 'balcao' ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <Store size={16}/><span className="text-[10px] font-bold">BALCÃO</span>
          </button>
          <button onClick={() => setOrderType('mesa')} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${orderType === 'mesa' ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <Utensils size={16}/><span className="text-[10px] font-bold">MESA</span>
          </button>
          <button onClick={() => {setOrderType('delivery'); setIsDelivery(true)}} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${orderType === 'delivery' ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <Truck size={16}/><span className="text-[10px] font-bold">DELIVERY</span>
          </button>
        </div>

        <div className="space-y-2">
          <input 
            placeholder={orderType === 'mesa' ? "Número da Mesa *" : "Nome do Cliente *"} 
            className="w-full p-2.5 text-sm bg-background border rounded-lg"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          
          {orderType === 'delivery' && (
            <div className="space-y-2 animate-in fade-in">
              <input 
                placeholder="CEP (Busca automática)" 
                className="w-full p-2.5 text-sm bg-background border rounded-lg"
                value={deliveryCep}
                onChange={(e) => handleCepSearch(e.target.value)}
              />
              <input 
                placeholder="Endereço Completo" 
                className="w-full p-2.5 text-sm bg-background border rounded-lg"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              <div className="flex gap-2">
                 <span className="text-xs text-muted-foreground">Taxa Entrega:</span>
                 <input type="number" className="w-20 border rounded px-1 text-sm" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value))}/>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border space-y-1">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between font-bold text-lg text-primary"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>

        <button 
          onClick={handleLaunchOrder}
          disabled={cart.length === 0}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50"
        >
          LANÇAR PEDIDO (COZINHA)
        </button>
      </div>
    </div>
  );
}