import { useState } from 'react';
import { usePosStore } from '@/store/pos-store';
import { CATEGORIES } from '@/types/pos';
import { Search } from 'lucide-react';

export function ProductGrid() {
  const { products, addToCart } = usePosStore();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 pos-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-muted-foreground hover:bg-secondary border border-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 overflow-y-auto flex-1 pos-scrollbar pb-2">
        {filtered.map((product, i) => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            className="bg-card border border-border rounded-xl p-3 sm:p-4 text-left hover:shadow-lg hover:border-primary/30 transition-all active:scale-[0.97] group animate-scale-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="w-full aspect-square rounded-lg bg-secondary/60 mb-2 sm:mb-3 flex items-center justify-center text-2xl overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl opacity-40">🍔</span>
              )}
            </div>
            <p className="font-semibold text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
              {product.name}
            </p>
            {product.description && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
            )}
            <p className="text-primary font-bold text-sm sm:text-base mt-1 sm:mt-2">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    </div>
  );
}
