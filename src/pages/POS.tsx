import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';

export default function POS() {
  return (
    <div className="flex h-full gap-4 p-4 animate-fade-in">
      <div className="flex-1 min-w-0">
        <ProductGrid />
      </div>
      <div className="w-[380px] shrink-0">
        <CartPanel />
      </div>
    </div>
  );
}
