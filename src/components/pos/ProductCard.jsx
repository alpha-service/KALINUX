import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDesign, DESIGNS } from "@/hooks/useDesign";
import { useLanguage } from "@/hooks/useLanguage";

export default function ProductCard({ product, addToCart, gridSize = "medium" }) {
  const { currentDesign, design } = useDesign();
  const { t, language } = useLanguage();

  // Extract product attributes for display
  const name_val = language === 'nl' ? (product.name_nl || product.name_fr) : product.name_fr;
  const nameParts = name_val?.split(' - ') || [name_val];
  const baseName = nameParts.slice(0, -1).join(' - ') || nameParts[0];
  const variantFromName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

  // Get attributes from product data (for card badges)
  const attributes = [];
  if (product.variant_title) attributes.push(product.variant_title);
  else if (variantFromName) attributes.push(variantFromName);
  if (product.size) attributes.push(product.size);
  if (product.color) attributes.push(product.color);

  // Build dimensions string
  const hasDimensions = product.length || product.width || product.height || product.depth;
  if (hasDimensions) {
    const parts = [];
    if (product.length) parts.push(`L:${product.length}`);
    if (product.width) parts.push(`W:${product.width}`);
    if (product.height) parts.push(`H:${product.height}`);
    if (product.depth) parts.push(`D:${product.depth}`);
    attributes.push(parts.join(' × ') + 'cm');
  }

  if (product.weight) attributes.push(`${product.weight}${product.weight_unit || 'kg'}`);
  if (product.material) attributes.push(product.material);

  // Get metafields for tooltip
  const metafields = product.metafields || {};
  const metaEntries = Object.entries(metafields);

  // Build complete attributes list for tooltip
  const allAttributes = [];
  if (product.variant_title) allAttributes.push({ label: t('pos_variant'), value: product.variant_title });
  if (product.size) allAttributes.push({ label: t('pos_size'), value: product.size });
  if (product.color) allAttributes.push({ label: t('pos_color'), value: product.color });
  if (product.material) allAttributes.push({ label: t('pos_material'), value: product.material });
  if (product.weight) allAttributes.push({ label: t('pos_weight'), value: `${product.weight} ${product.weight_unit || 'kg'}` });
  if (product.length) allAttributes.push({ label: t('pos_length'), value: `${product.length} cm` });
  if (product.width) allAttributes.push({ label: t('pos_width'), value: `${product.width} cm` });
  if (product.height) allAttributes.push({ label: t('pos_height'), value: `${product.height} cm` });
  if (product.depth) allAttributes.push({ label: t('pos_depth'), value: `${product.depth} cm` });

  // Add metafields to attributes
  metaEntries.forEach(([key, value]) => {
    if (value && !allAttributes.some(a => a.label.toLowerCase() === key.toLowerCase())) {
      allAttributes.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: value });
    }
  });

  const tooltipContent = (
    <div className="max-w-sm p-2 space-y-1.5">
      <div className="font-bold text-sm border-b border-white/20 pb-1.5">{product.name_fr}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <div><span className="opacity-70">SKU:</span> {product.sku}</div>
        {product.vendor && <div><span className="opacity-70">{t('pos_brand')}:</span> {product.vendor}</div>}
        {product.barcode && <div><span className="opacity-70">{t('pos_code')}:</span> {product.barcode}</div>}
        {product.product_type && <div><span className="opacity-70">{t('pos_type')}:</span> {product.product_type}</div>}
      </div>

      {allAttributes.length > 0 && (
        <div className="pt-1.5 border-t border-white/20">
          <div className="font-medium text-xs mb-1 text-brand-orange">📐 {t('pos_attributes')}:</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            {allAttributes.map((attr, idx) => (
              <div key={idx}>
                <span className="opacity-70">{attr.label}:</span> <span className="font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.tags && (
        <div className="text-xs pt-1 border-t border-white/20 opacity-75">
          🏷️ {Array.isArray(product.tags) ? product.tags.join(', ') : product.tags}
        </div>
      )}

      <div className="flex justify-between items-center pt-1.5 border-t border-white/20">
        <span className="text-xs font-bold text-green-400">📦 {t('pos_stock')}: {product.stock_qty} {product.unit}</span>
        <span className="text-sm font-bold text-brand-orange">€{product.price_retail.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "product-card overflow-hidden text-left focus:outline-none active:scale-95 relative group",
              design.productCardStyle,
              design.transition,
              gridSize === 'small' ? 'p-1' : '',
              currentDesign === DESIGNS.MODERN && "focus:ring-2 focus:ring-purple-500/30",
              currentDesign === DESIGNS.MINIMAL && "focus:ring-0 focus:border-black",
              currentDesign === DESIGNS.CLASSIC && "focus:ring-2 focus:ring-brand-navy/20",
              // currentDesign === DESIGNS.LEGACY && "focus:ring-2 focus:ring-orange-400/50" // LEGACY not imported
            )}
            onClick={() => addToCart(product)}
            data-testid={`product-${product.id}`}
          >
            {/* Image */}
            <div className={cn(
              "relative overflow-hidden",
              currentDesign === DESIGNS.MODERN ? "bg-gradient-to-br from-slate-100 to-slate-200" :
              currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" : "bg-slate-100",
              gridSize === 'small' ? 'aspect-square' : 'aspect-[4/3]'
            )}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name_fr}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-slate-300 ${
                  gridSize === 'small' ? 'text-xl' : 'text-3xl'
                }`}>
                  📦
                </div>
              )}
              
              {/* Stock Badge */}
              {product.stock_qty < 10 && (
                <Badge className={cn(
                  "absolute",
                  gridSize === 'small' ? 'top-0.5 right-0.5 text-[8px] px-1 py-0' : 'top-1 right-1 text-[10px]',
                  product.stock_qty <= 0 ? "bg-red-500" : "bg-amber-500"
                )}>
                  {gridSize === 'small' ? product.stock_qty : `${t('pos_stock')}: ${product.stock_qty}`}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className={gridSize === 'small' ? 'p-1' : 'p-2'}>
              {gridSize !== 'small' && (
                <p className="text-[10px] text-muted-foreground font-mono truncate">{product.sku}</p>
              )}
              
              <p className={cn(
                "font-medium leading-tight",
                currentDesign === DESIGNS.MODERN ? "text-slate-800" : "text-slate-900",
                gridSize === 'small' ? 'text-[10px] truncate' : 
                gridSize === 'large' ? 'text-sm line-clamp-2' : 'text-xs line-clamp-2'
              )}>
                {baseName}
              </p>

              {/* Attributes badges */}
              {gridSize !== 'small' && attributes.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {attributes.slice(0, 2).map((attr, idx) => (
                    <span key={idx} className={cn(
                      "inline-block px-1 py-0.5 text-[8px] font-medium rounded truncate max-w-[60px]",
                      currentDesign === DESIGNS.MODERN 
                        ? "bg-purple-100 text-purple-700"
                        : "bg-brand-orange/10 text-brand-orange"
                    )}>
                      {attr}
                    </span>
                  ))}
                  {attributes.length > 2 && (
                    <span className="inline-block px-1 py-0.5 text-[8px] font-medium bg-slate-100 text-slate-500 rounded">
                      +{attributes.length - 2}
                    </span>
                  )}
                </div>
              )}

              {gridSize === 'large' && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{language === 'nl' ? (product.name_fr || product.name_nl) : product.name_nl}</p>
              )}

              {/* Price */}
              <div className={`flex items-baseline justify-between ${
                gridSize === 'small' ? 'mt-0.5' : 'mt-1'
              }`}>
                <span className={cn(
                  "font-bold",
                  currentDesign === DESIGNS.MODERN ? "text-purple-900" : "text-brand-navy",
                  gridSize === 'small' ? 'text-xs' : gridSize === 'large' ? 'text-base' : 'text-sm'
                )}>
                  €{product.price_retail.toFixed(2)}
                </span>
                {gridSize !== 'small' && (
                  <span className="text-[10px] text-muted-foreground">/ {product.unit}</span>
                )}
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700 z-50">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
