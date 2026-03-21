import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { Plus, Trash2, Save, Store, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { deliveryTiers, storeName, addDeliveryTier, updateDeliveryTier, removeDeliveryTier, setStoreName } = usePosStore();
  const [newTier, setNewTier] = useState({ fromKm: '', toKm: '', fee: '' });
  const [editingName, setEditingName] = useState(storeName);

  const handleAddTier = () => {
    if (!newTier.fromKm || !newTier.toKm || !newTier.fee) {
      toast.error('Preencha todos os campos da faixa');
      return;
    }
    addDeliveryTier({ fromKm: Number(newTier.fromKm), toKm: Number(newTier.toKm), fee: Number(newTier.fee) });
    setNewTier({ fromKm: '', toKm: '', fee: '' });
    toast.success('Faixa adicionada');
  };

  const handleSaveName = () => {
    setStoreName(editingName);
    toast.success('Nome atualizado');
  };

  return (
    <div className="p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      {/* Store name */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Nome da Loja</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSaveName}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delivery tiers */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-5 w-5 text-pos-delivery" />
          <h2 className="font-semibold">Faixas de Taxa de Entrega</h2>
        </div>

        <div className="space-y-2 mb-4">
          {deliveryTiers.map((tier) => (
            <div key={tier.id} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-4 py-3 text-sm">
              <span className="flex-1">
                <span className="font-semibold">{tier.fromKm}km</span>
                <span className="text-muted-foreground"> até </span>
                <span className="font-semibold">{tier.toKm}km</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-bold text-primary">R$ {tier.fee.toFixed(2).replace('.', ',')}</span>
              </span>
              <button
                onClick={() => removeDeliveryTier(tier.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {deliveryTiers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma faixa cadastrada</p>
          )}
        </div>

        {/* Add new tier */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">De (km)</label>
            <input
              type="number"
              step="0.5"
              value={newTier.fromKm}
              onChange={(e) => setNewTier((t) => ({ ...t, fromKm: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Até (km)</label>
            <input
              type="number"
              step="0.5"
              value={newTier.toKm}
              onChange={(e) => setNewTier((t) => ({ ...t, toKm: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Taxa (R$)</label>
            <input
              type="number"
              step="0.50"
              value={newTier.fee}
              onChange={(e) => setNewTier((t) => ({ ...t, fee: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <button
            onClick={handleAddTier}
            className="h-[38px] px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Menu link */}
      <div className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in" style={{ animationDelay: '160ms' }}>
        <h2 className="font-semibold mb-2">Link do Cardápio Online</h2>
        <p className="text-xs text-muted-foreground mb-3">Compartilhe com seus clientes para receberem pedidos</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={`${window.location.origin}/menu`}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/menu`);
              toast.success('Link copiado!');
            }}
            className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-all"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
