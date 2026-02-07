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
  const [tempDiscount, setTempDiscount] = useState({ type: "percent", value: "", target: "htva" });

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
        value: discountValue,
        target: item.discount_target || "htva"
      });
      setTimeout(() => discountInputRef.current?.focus(), 50);
    }
  }, [isEditingDiscount, item.discount_type, item.discount_value, item.discount_target]);

  // Calculations
  const lineSubtotal = item.qty * item.unit_price;
  let discountAmount = 0;

  if (item.discount_type === "percent") {
    // If target is TTC, we calculate percent of TTC, but discount matches HTVA ratio effectively?
    // Actually, X% off HTVA is same as X% off TTC (mathematically) 
    // UNLESS the user wants to enter "10 euros off TTC" vs "10 euros off HTVA".
    // For percent: 10% off 100+21(VAT) = 12.1 discount (10 off base, 2.1 off vat).
    // 10% off 100(HTVA) = 10 discount. + Tax on (90) = 18.9. Total 108.9. 
    // Valid for Fixed amount mainly.
    // User asked for: "remise v % kotorye nanosyatsya na product, sdelat HTVA"

    // We will follow global logic:
    // If percent, it applies to base.
    discountAmount = lineSubtotal * (item.discount_value / 100);
  } else if (item.discount_type === "fixed") {
    if (item.discount_target === "ttc") {
      // Discount is entered as TTC value (e.g. 10€ off the final price)
      // We need to back-calculate the HTVA portion.
      // 10€ TTC at 21% VAT = 10 / 1.21 = 8.26€ HTVA discount
      discountAmount = item.discount_value / (1 + (item.vat_rate / 100));
    } else {
      // Discount is HTVA
      discountAmount = item.discount_value;
    }
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
          <Input
            type="number"
            value={item.qty}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 0) {
                onUpdateQuantity(item.product_id, val - item.qty);
              }
            }}
            className="w-8 h-5 text-center text-[10px] font-medium p-0 border-none bg-transparent focus-visible:ring-0"
          />
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
            className={`text-xs font-bold cursor-pointer hover:text-brand-orange ${item.priceOverridden ? 'text-amber-600' : item.discount_value > 0 ? 'text-green-600' : 'text-brand-navy'
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
          <Input
            type="number"
            value={item.qty}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              if (val >= 0) {
                onUpdateQuantity(item.product_id, val - item.qty);
              }
            }}
            onBlur={(e) => {
              if (!e.target.value || parseInt(e.target.value) === 0) {
                onUpdateQuantity(item.product_id, 1 - item.qty);
              }
            }}
            className="w-10 h-6 text-center text-sm font-medium p-0 border-none bg-transparent focus-visible:ring-0"
          />
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
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-1 mb-1">
              <Button
                variant={tempDiscount.target === 'htva' ? "default" : "outline"}
                size="sm"
                className={cn("h-5 text-[9px] px-2", tempDiscount.target === 'htva' ? "bg-brand-navy text-white hover:bg-brand-navy/90" : "hover:bg-slate-100")}
                onClick={() => setTempDiscount(prev => ({ ...prev, target: 'htva' }))}
              >
                {t('pos_target_htva')}
              </Button>
              <Button
                variant={tempDiscount.target === 'ttc' ? "default" : "outline"}
                size="sm"
                className={cn("h-5 text-[9px] px-2", tempDiscount.target === 'ttc' ? "bg-brand-navy text-white hover:bg-brand-navy/90" : "hover:bg-slate-100")}
                onClick={() => setTempDiscount(prev => ({ ...prev, target: 'ttc' }))}
              >
                {t('pos_target_ttc')}
              </Button>
            </div>
            <div className="flex items-center gap-1 w-full">
              <select
                className="h-6 text-[10px] border rounded px-1 bg-white min-w-[40px]"
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
                className="h-6 w-16 text-[10px] p-1 text-center"
                value={tempDiscount.value}
                onChange={(e) => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = "";

                  if (tempDiscount.type === "percent") {
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                  } else {
                    if (val < 0) val = 0;
                  }

                  setTempDiscount(prev => ({ ...prev, value: val.toString() }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value, true, tempDiscount.target); }
                  if (e.key === 'Tab') { e.preventDefault(); onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value, true, tempDiscount.target); }
                  if (e.key === 'Escape') onCancelDiscount();
                }}
                placeholder="0"
              />
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600 hover:bg-green-50" onClick={() => onConfirmDiscount(item.product_id, tempDiscount.type, tempDiscount.value, false, tempDiscount.target)}>✓</Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={onCancelDiscount}>✕</Button>
            </div>
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
        )
        }

        <span className="text-[10px] text-muted-foreground">
          {t('pos_tax')} {item.vat_rate}%: €{lineVat.toFixed(2)}
        </span>
      </div >

      {/* Total Row */}
      < div className={
        cn(
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
      </div >
    </div >
  );
}
