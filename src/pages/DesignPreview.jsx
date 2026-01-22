import { useState } from "react";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Tag,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useDesign, DESIGNS } from "@/hooks/useDesign";
import { useTheme } from "@/hooks/useTheme";
import ProductCard from "@/components/pos/ProductCard";
import CategoryCard from "@/components/pos/CategoryCard";
import CartItem from "@/components/pos/CartItem";
import DesignSelector from "@/components/DesignSelector";
import ThemeSelector from "@/components/ThemeSelector";
import { cn } from "@/lib/utils";

export default function DesignPreview() {
  const { currentDesign, design } = useDesign();
  const { colors } = useTheme();

  // Mock Data
  const mockProduct = {
    id: 1,
    name_fr: "Carrelage Métro Blanc - 10x20cm",
    name_nl: "Metrotegel Wit - 10x20cm",
    sku: "CER-MET-WHT",
    price_retail: 24.99,
    unit: "m2",
    stock_qty: 150,
    image_url: null, // Will show placeholder
    tags: ["Ceramique", "Mur", "Intérieur"],
    vat_rate: 21
  };

  const mockCategory = {
    id: 1,
    name_fr: "Céramique & Carrelage",
    product_count: 142,
    image_url: null
  };

  const mockCartItem = {
    product_id: 1,
    name: "Carrelage Métro Blanc",
    sku: "CER-MET-WHT",
    qty: 5,
    unit_price: 24.99,
    vat_rate: 21,
    discount_type: "percent",
    discount_value: 10,
    unit: "m2"
  };

  return (
    <div className={cn(
      "min-h-screen p-8 transition-colors duration-300",
      currentDesign === DESIGNS.MODERN ? "bg-slate-100" :
      currentDesign === DESIGNS.MINIMAL ? "bg-white" : "bg-gray-50"
    )}>
      
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            currentDesign === DESIGNS.MODERN ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" :
            currentDesign === DESIGNS.MINIMAL ? "text-black tracking-tight" : "text-brand-navy"
          )}>
            Design System Preview
          </h1>
          <p className="text-muted-foreground">
            Aperçu de tous les composants graphiques.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
          <DesignSelector variant="outline" size="sm" showLabel />
          <ThemeSelector variant="outline" size="sm" showLabel />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: Base Elements (Buttons, Inputs, Colors) */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Boutons & Interactions
            </h2>
            <div className={cn(
              "p-6 space-y-6 border",
              currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur rounded-2xl border-white/20 shadow-xl" :
              currentDesign === DESIGNS.MINIMAL ? "bg-white border-2 border-black rounded-none" : "bg-white rounded-lg border-slate-200 shadow-sm"
            )}>
              {/* Primary Buttons */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Primary Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button className={design.primaryButton}>Bouton Principal</Button>
                  <Button className={design.primaryButton} disabled>Désactivé</Button>
                  <Button className={design.primaryButton} size="sm">Petit</Button>
                  <Button className={design.primaryButton} size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Secondary Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className={design.secondaryButton}>Secondaire</Button>
                  <Button variant="outline" className={cn("border-dashed", currentDesign === DESIGNS.MODERN ? "rounded-xl" : "")}>
                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                  </Button>
                  <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </Button>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Form Elements</h3>
                <div className="grid gap-4 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      className={cn("pl-9", design.inputStyle, design.inputBorder, design.inputFocus)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Quantité" 
                      type="number"
                      className={cn(design.inputStyle, design.inputBorder, design.inputFocus)}
                    />
                    <Button className={design.primaryButton}>Valider</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Typography & Colors */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Typographie & Couleurs
            </h2>
            <div className={cn(
              "p-6 grid grid-cols-2 gap-4 border",
              currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur rounded-2xl border-white/20 shadow-xl" :
              currentDesign === DESIGNS.MINIMAL ? "bg-white border-2 border-black rounded-none" : "bg-white rounded-lg border-slate-200 shadow-sm"
            )}>
              <div className="space-y-1">
                <div className="h-12 w-full rounded-lg" style={{ backgroundColor: colors.primary }}></div>
                <p className="text-xs font-mono">Primary</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full rounded-lg" style={{ backgroundColor: colors.secondary }}></div>
                <p className="text-xs font-mono">Secondary</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full rounded-lg bg-slate-900"></div>
                <p className="text-xs font-mono">Dark</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full rounded-lg bg-slate-100 border"></div>
                <p className="text-xs font-mono">Light</p>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 3: Components (Cards, Cart) */}
        <div className="space-y-8">
          
          {/* Product Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Composants POS
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Product Card (Normal vs Small)</h3>
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="w-48">
                    <ProductCard 
                      product={mockProduct} 
                      addToCart={() => {}} 
                      gridSize="medium"
                    />
                  </div>
                  <div className="w-24">
                    <ProductCard 
                      product={mockProduct} 
                      addToCart={() => {}} 
                      gridSize="small"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Category Card</h3>
                <div className="w-40 h-40">
                  <CategoryCard 
                    category={mockCategory} 
                    onSelect={() => {}}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cart Item */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Panier
            </h2>
            
            <div className={cn(
              "p-4 border max-w-md",
              currentDesign === DESIGNS.MODERN ? "bg-white/60 backdrop-blur rounded-2xl border-white/20" :
              currentDesign === DESIGNS.MINIMAL ? "bg-white border-2 border-black" : "bg-white rounded-lg border-slate-200"
            )}>
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Normal View</h3>
                <CartItem 
                  item={mockCartItem}
                  compact={false}
                  onUpdateQuantity={() => {}}
                  onRemove={() => {}}
                  onStartEditPrice={() => {}}
                  onConfirmPrice={() => {}}
                  onCancelPrice={() => {}}
                  onStartEditDiscount={() => {}}
                  onConfirmDiscount={() => {}}
                  onCancelDiscount={() => {}}
                  onRemoveDiscount={() => {}}
                />
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Compact View</h3>
                <CartItem 
                  item={mockCartItem}
                  compact={true}
                  onUpdateQuantity={() => {}}
                  onRemove={() => {}}
                  onStartEditPrice={() => {}}
                  onConfirmPrice={() => {}}
                  onCancelPrice={() => {}}
                  onStartEditDiscount={() => {}}
                  onConfirmDiscount={() => {}}
                  onCancelDiscount={() => {}}
                  onRemoveDiscount={() => {}}
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
