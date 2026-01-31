import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, createRef } from 'react';

export default function CartTable({
  cart, 
  onUpdateQty, 
  onRemoveItem, 
  onPriceClick,
  subtotal,
  vatTotal,
  total,
  onPay,
  highlightedItemId,
  selectedItemId,
  onSelectItem
}) {
  // Refs for remise inputs
  const remiseRefs = useRef([]);
  useEffect(() => {
    remiseRefs.current = remiseRefs.current.slice(0, cart.length);
    for (let i = 0; i < cart.length; i++) {
      if (!remiseRefs.current[i]) remiseRefs.current[i] = createRef();
    }
  }, [cart.length]);
  const tableRef = useRef(null);

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedItemId && tableRef.current) {
      const element = document.getElementById(`cart-row-${highlightedItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [highlightedItemId]);

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-heading font-bold text-sm sm:text-base lg:text-lg">Panier</h2>
        <Badge variant="outline" className="text-xs">{cart.length}</Badge>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1" ref={tableRef}>
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-200">
              <th className="text-left p-1 sm:p-2 font-semibold w-8 sm:w-12">#</th>
              <th className="text-left p-1 sm:p-2 font-semibold">Article</th>
              <th className="text-center p-1 sm:p-2 font-semibold w-16 sm:w-20">Qté</th>
              <th className="text-right p-1 sm:p-2 font-semibold w-16 sm:w-20 hidden sm:table-cell">P.U.</th>
              <th className="text-right p-1 sm:p-2 font-semibold w-16 sm:w-24">Total</th>
              <th className="text-center p-1 sm:p-2 font-semibold w-10 sm:w-16"></th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-500">Panier vide</td>
              </tr>
            ) : (
              cart.map((item, idx) => {
                const lineTotal = item.qty * item.unit_price;
                return (
                  <tr key={item.product_id} id={`cart-row-${item.product_id}`} className={selectedItemId === item.product_id ? 'bg-yellow-50' : ''} onClick={() => onSelectItem && onSelectItem(item.product_id)}>
                    <td className="p-1 sm:p-2 font-mono text-[10px] sm:text-xs">{idx + 1}</td>
                    {/* Article */}
                    <td className="p-1 sm:p-2">
                      <div>
                        <div className="font-medium truncate text-[11px] sm:text-sm">{item.name}</div>
                        <div className="text-[9px] sm:text-xs text-slate-500 font-mono hidden sm:block">{item.sku}</div>
                        {item.discount_value > 0 && (
                          <div className="text-[9px] sm:text-xs text-green-600 mt-0.5">
                            -{item.discount_type === 'percent' 
                              ? `${item.discount_value}%` 
                              : `€${item.discount_value.toFixed(2)}`}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Quantity */}
                    <td className="p-1 sm:p-2">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQty(item.product_id, Math.max(1, item.qty - 1));
                          }}
                        >
                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                        <div className="w-6 sm:w-8 text-center font-medium text-[11px] sm:text-sm">{item.qty}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQty(item.product_id, item.qty + 1);
                          }}
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                      </div>
                    </td>
                    {/* Unit Price */}
                    <td className="p-1 sm:p-2 text-right hidden sm:table-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPriceClick(item);
                        }}
                        className="font-mono text-[10px] sm:text-xs hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        €{item.unit_price.toFixed(2)}
                      </button>
                      {item.priceOverridden && (
                        <Badge className="ml-1 text-[8px] sm:text-xs bg-amber-100 text-amber-800">M</Badge>
                      )}
                    </td>
                    {/* Total */}
                    <td className="p-1 sm:p-2 text-right">
                      <span className="font-bold text-brand-navy font-mono text-[11px] sm:text-sm">
                        €{lineTotal.toFixed(2)}
                      </span>
                    </td>
                    {/* Remise Input */}
                    <td className="p-1 sm:p-2 text-center">
                      <input
                        ref={el => remiseRefs.current[idx] = el}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.remise === 0 ? '' : item.remise}
                        onFocus={e => {
                          if (e.target.value === '0') e.target.value = '';
                        }}
                        onChange={e => {
                          let v = e.target.value;
                          if (v === '0') v = '';
                          if (onUpdateQty) onUpdateQty(item.product_id, item.qty, v);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (remiseRefs.current[idx + 1]) {
                              remiseRefs.current[idx + 1].focus();
                            }
                          }
                        }}
                        className="w-14 px-1 py-1 text-[11px] border rounded remise-input"
                      />
                    </td>
                    {/* Delete */}
                    <td className="p-1 sm:p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(item.product_id);
                        }}
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollArea>

      {/* Footer - Sticky Totals + Pay Button */}
      <div className="border-t border-slate-200 bg-slate-50 p-2 sm:p-4 space-y-2 sm:space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Sous-total HT:</span>
              <span className="font-mono">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">TVA:</span>
              <span className="font-mono">€{vatTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-brand-navy text-white rounded-lg">
            <span className="font-bold text-xs sm:text-sm">TOTAL</span>
            <span className="text-lg sm:text-2xl font-bold font-mono">€{total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full h-12 sm:h-16 text-base sm:text-xl font-bold bg-brand-orange hover:bg-brand-orange/90 shadow-lg"
          onClick={onPay}
          disabled={cart.length === 0}
        >
          PAYER
        </Button>
      </div>
    </div>
  );
}
