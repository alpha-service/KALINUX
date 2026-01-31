import { useState, useEffect, useRef } from "react";
import { Minus, Plus, Trash2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDesign, DESIGNS } from "@/hooks/useDesign";
import { useLanguage } from "@/hooks/useLanguage";

export default function CartItem({
  item,
  compact,
  highlighted,
  isEditingPrice,
  isEditingDiscount,
  onUpdateQuantity,
  onRemove,
  onStartEditPrice,
  onConfirmPrice,
  onCancelPrice,
  onStartEditDiscount,
  onConfirmDiscount,
  onCancelDiscount,
  onRemoveDiscount
}) {
  const { currentDesign, design } = useDesign();
  const { t } = useLanguage();
  const priceInputRef = useRef(null);
  const discountInputRef = useRef(null);

  // Local temp state for inputs
  const [tempPrice, setTempPrice] = useState("");
  const [tempDiscount, setTempDiscount] = useState({ type: "percent", value: "" });

  // Sync temp state when editing starts
  useEffect(() => {
    if (isEditingPrice) {
      setTempPrice(item.unit_price.toString());
      setTimeout(() => priceInputRef.current?.focus(), 50);
    }
  }, [isEditingPrice, item.unit_price]);

  useEffect(() => {
    if (isEditingDiscount) {
      // Show empty field if discount is 0, otherwise show the value
      const discountValue = item.discount_value && item.discount_value > 0 ? item.discount_value.toString() : "";
      setTempDiscount({ 
        type: item.discount_type || "percent", 
        value: discountValue
      });
      setTimeout(() => discountInputRef.current?.focus(), 50);
    }
  }, [isEditingDiscount, item.discount_type, item.discount_value]);

  // Calculations
  const lineSubtotal = item.qty * item.unit_price;
  let discountAmount = 0;
  if (item.discount_type === "percent") {
    discountAmount = lineSubtotal * (item.discount_value / 100);
  } else if (item.discount_type === "fixed") {
    discountAmount = item.discount_value;
  }
  const afterDiscount = lineSubtotal - discountAmount;
  const lineVat = afterDiscount * (item.vat_rate / 100);
  const lineTotal = afterDiscount + lineVat;

  // --- COMPACT MODE ---
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5",
          design.transition,
          currentDesign === DESIGNS.MODERN ? "hover:bg-purple-50" :
          currentDesign === DESIGNS.MINIMAL ? "hover:bg-neutral-100" : "hover:bg-slate-50",
          highlighted && (
            currentDesign === DESIGNS.MODERN ? "bg-purple-100" :
            currentDesign === DESIGNS.MINIMAL ? "bg-neutral-200" : "bg-orange-50"
          ),
          item.priceOverridden && "bg-amber-50",
          item.discount_value > 0 && (
            currentDesign === DESIGNS.MODERN ? "bg-green-50/50" : "bg-green-50"
          )
        )}
      >
        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.name}</p>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span>{t('pos_tax')} {item.vat_rate}%</span>
            {item.discount_value > 0 && (
              <span className="text-green-600">
                | -{item.discount_type === "percent" ? `${item.discount_value}%` : `€${item.discount_value}`}
              </span>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className={cn(
          "flex items-center gap-0.5 px-1",
          currentDesign === DESIGNS.MODERN ? "bg-purple-100 rounded-full" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-200 rounded-none" : "bg-slate-100 rounded"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => onUpdateQuantity(item.product_id, -1)}
          >
            <Minus className="w-2.5 h-2.5" />
          </Button>
          <span className="w-5 text-center text-xs font-medium">{item.qty}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => onUpdateQuantity(item.product_id, 1)}
          >
            <Plus className="w-2.5 h-2.5" />
          </Button>
        </div>

        {/* Discount Btn */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-5 w-5 p-0",
            item.discount_value > 0 ? "text-green-600" : "text-muted-foreground"
          )}
          onClick={() => onStartEditDiscount(item.product_id)}
          title={t('discount')}
        >
          <Tag className="w-3 h-3" />
        </Button>

        {/* Price Edit */}
        {isEditingPrice ? (
          <div className="flex items-center gap-0.5">
            <Input
              ref={priceInputRef}
              type="number"
              step="0.01"
              className={cn(
                "h-5 w-14 text-[10px] p-1",
                currentDesign === DESIGNS.MODERN ? "rounded-lg" :
                currentDesign === DESIGNS.MINIMAL ? "rounded-none" : ""
              )}
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onConfirmPrice(item.product_id, tempPrice, true); }
                if (e.key === 'Tab') { e.preventDefault(); onConfirmPrice(item.product_id, tempPrice, true); }
                if (e.key === 'Escape') onCancelPrice();
              }}
              onBlur={() => onConfirmPrice(item.product_id, tempPrice)}
            />
          </div>
        ) : (
          <span 
            className={`text-xs font-bold cursor-pointer hover:text-brand-orange ${
              item.priceOverridden ? 'text-amber-600' : item.discount_value > 0 ? 'text-green-600' : 'text-brand-navy'
            }`}
            onClick={() => onStartEditPrice(item.product_id)}
            title={t('pos_edit_price')}
          >
            €{afterDiscount.toFixed(2)}
          </span>
        )}

        {/* Remove */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
          onClick={() => onRemove(item.product_id)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // --- NORMAL MODE ---
  return (
    <div
      className={cn(
        "cart-item p-2 transition-all",
        currentDesign === DESIGNS.MODERN ? "bg-white/60 backdrop-blur-sm mb-2 rounded-xl border border-purple-100 shadow-sm" :
        currentDesign === DESIGNS.MINIMAL ? "bg-white border-b border-neutral-200 mb-0" : "bg-white rounded-lg border border-slate-200 mb-1.5",
        highlighted && (
          currentDesign === DESIGNS.MODERN ? "bg-purple-50 border-purple-300 ring-2 ring-purple-100" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" : "border-brand-orange bg-orange-50 scale-[1.02]"
        ),
        item.priceOverridden && "ring-1 ring-amber-400",
        item.discount_value > 0 && "ring-1 ring-green-400"
      )}
      data-testid={`cart-item-${item.product_id}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-medium text-xs truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">{item.sku}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          onClick={() => onRemove(item.product_id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Qty + Price */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className={cn(
          "flex items-center gap-1 p-0.5",
          currentDesign === DESIGNS.MODERN ? "bg-purple-50 rounded-lg" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100 rounded-none border border-neutral-200" : "bg-slate-100 rounded-lg"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onUpdateQuantity(item.product_id, -1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onUpdateQuantity(item.product_id, 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Unit Price Edit */}
        {isEditingPrice ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">€</span>
            <Input
              ref={priceInputRef}
              type="number"
              step="0.01"
              min="0"
              className="h-5 w-14 text-[10px] text-right p-1"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onConfirmPrice(item.product_id, tempPrice, true); }
                if (e.key === 'Tab') { e.preventDefault(); onConfirmPrice(item.product_id, tempPrice, true); }
                if (e.key === 'Escape') onCancelPrice();
              }}
              onBlur={() => onConfirmPrice(item.product_id, tempPrice)}
            />
          </div>
        ) : (
          <div 
            className={cn(
              "flex items-center gap-1 cursor-pointer px-1 py-0.5",
              currentDesign === DESIGNS.MODERN ? "hover:bg-purple-50 rounded" : "hover:bg-slate-100 rounded",
              item.priceOverridden && "bg-amber-50"
            )}
            onClick={() => onStartEditPrice(item.product_id)}
            title={t('pos_edit_price')}
          >
            <span className={`text-[10px] ${item.priceOverridden ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
              €{item.unit_price.toFixed(2)} / {item.unit}
            </span>
          </div>
        )}
      </div>

      {/* Discount Row */}
      <div className="flex items-center justify-between gap-2 mb-1 py-1 border-t border-slate-100/50">
        {isEditingDiscount ? (
          <div className="flex items-center gap-1 flex-1">
            <select
              className="h-5 text-[10px] border rounded px-1 bg-white"
              value={tempDiscount.type}
              onChange={(e) => setTempDiscount(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="percent">%</option>
              <option value="fixed">€</option>
            </select>
            <Input
              ref={discountInputRef}
              type="number"
              step="0.01"
              min="0"
              className="h-5 w-14 text-[10px] p-1"
              value={tempDiscount.value}
              onChange={(e) => setTempDiscount(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value, true); }
                if (e.key === 'Tab') { e.preventDefault(); onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value, true); }
                if (e.key === 'Escape') onCancelDiscount();
              }}
              placeholder="0"
            />
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={() => onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value)}>✓</Button>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-500" onClick={onCancelDiscount}>✕</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-5 px-1 text-[10px]",
                item.discount_value > 0 ? "text-green-600 bg-green-50" : "text-muted-foreground hover:bg-slate-100"
              )}
              onClick={() => onStartEditDiscount(item.product_id)}
              title={t('discount')}
            >
              <Tag className="w-3 h-3 mr-0.5" />
              {item.discount_value > 0 
                ? (item.discount_type === "percent" ? `-${item.discount_value}%` : `-€${item.discount_value}`)
                : t('discount')
              }
            </Button>
            {item.discount_value > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                onClick={() => onRemoveDiscount(item.product_id)}
                title={t('pos_remove_discount')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
        
        <span className="text-[10px] text-muted-foreground">
          {t('pos_tax')} {item.vat_rate}%: €{lineVat.toFixed(2)}
        </span>
      </div>

      {/* Total Row */}
      <div className={cn(
        "flex items-center justify-between pt-1 border-t",
        currentDesign === DESIGNS.MODERN ? "border-purple-100/50" : "border-slate-100"
      )}>
        <div className="text-[10px] text-muted-foreground">
          {item.discount_value > 0 && (
            <span className="text-green-600">
              {t('discount')}: -€{discountAmount.toFixed(2)}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className={cn(
            "font-bold text-sm",
            currentDesign === DESIGNS.MODERN ? "text-purple-900" :
            currentDesign === DESIGNS.MINIMAL ? "text-black" : "text-brand-navy"
          )}>
            €{afterDiscount.toFixed(2)}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {t('pos_incl_tax')}: €{lineTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
