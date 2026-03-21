import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { CATEGORIES } from '@/types/pos';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct } = usePosStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'Lanches', description: '', barcode: '' });

  const resetForm = () => {
    setForm({ name: '', price: '', category: 'Lanches', description: '', barcode: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setForm({ name: p.name, price: String(p.price), category: p.category, description: p.description || '', barcode: p.barcode || '' });
    setEditId(id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Preencha nome e preço');
      return;
    }
    const data = { name: form.name, price: Number(form.price), category: form.category, description: form.description, barcode: form.barcode };
    if (editId) {
      updateProduct(editId, data);
      toast.success('Produto atualizado');
    } else {
      addProduct(data);
      toast.success('Produto cadastrado');
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    removeProduct(id);
    toast.success('Produto removido');
  };

  const categories = CATEGORIES.filter((c) => c !== 'Todos');

  return (
    <div className="p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground text-sm">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 animate-slide-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editId ? 'Editar Produto' : 'Novo Produto'}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nome do produto *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preço *"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder="Código de barras"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              placeholder="Descrição"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring md:col-span-2"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Check className="h-4 w-4" />
            {editId ? 'Salvar' : 'Cadastrar'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-5 py-3 font-semibold">Produto</th>
              <th className="text-left px-5 py-3 font-semibold">Categoria</th>
              <th className="text-right px-5 py-3 font-semibold">Preço</th>
              <th className="text-right px-5 py-3 font-semibold w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-5 py-3">
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">{p.category}</span>
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary">
                  R$ {p.price.toFixed(2).replace('.', ',')}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleEdit(p.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary active:scale-90 transition-all">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
