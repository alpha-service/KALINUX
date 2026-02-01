import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Search, ShoppingCart, Plus, Minus, Trash2, User, Receipt, X, Printer, Download, FileText, FileCheck, Settings, LayoutGrid, Package, Truck, CreditCard, Minimize2, Maximize2, ArrowLeft, FolderOpen, ChevronRight, Home, Layers, Percent, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PaymentModal from "@/components/PaymentModal";
import CustomerSelect from "@/components/CustomerSelect";
import { usePOSLayout } from "@/hooks/usePOSLayout";
import ResizableHandle from "@/components/pos/ResizableHandle";
import LayoutSelector from "@/components/pos/LayoutSelector";
import DesignSelector from "@/components/DesignSelector";
import { useTheme } from "@/hooks/useTheme";
import { useDesign, DESIGNS } from "@/hooks/useDesign";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/pos/ProductCard";
import CategoryCard from "@/components/pos/CategoryCard";
import CartItem from "@/components/pos/CartItem";

const API = '/api';

export default function POSScreen() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { colors } = useTheme();
  const { currentDesign, design } = useDesign();
  const { t, language } = useLanguage();

  // Layout system
  const {
    currentPreset,
    setCurrentPreset,
    config,
    cartWidth,
    updateCartWidth,
    cycleLayout,
    drawerOpen,
    setDrawerOpen,
    LAYOUT_PRESETS,
    PRESET_CONFIG
  } = usePOSLayout();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // NEW: Store all products for barcode scanner
  const [categories, setCategories] = useState([]);
  // Cart persistence - load from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch { return []; }
  });
  // Customer persistence
  const [savedCustomerId, setSavedCustomerId] = useState(() => localStorage.getItem('pos_customer_id'));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posViewMode, setPosViewMode] = useState("collections"); // NEW: "collections" | "products"
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false); // NEW: For smooth category switching
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState({ type: null, value: 0 });
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountInput, setDiscountInput] = useState({ type: "percent", value: "" });
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [productGridSize, setProductGridSize] = useState(() => localStorage.getItem('product_grid_size') || 'medium');

  // NEW: Compact cart mode and price editing
  const [compactCart, setCompactCart] = useState(() => localStorage.getItem('compact_cart') === 'true');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [selectedSize, setSelectedSize] = useState(null); // NEW: Size filter

  // NEW: Individual item discount editing
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [tempDiscount, setTempDiscount] = useState({ type: "percent", value: "" });

  // Layout-related state
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [priceOverrideItem, setPriceOverrideItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Quick add product popup
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProductData, setQuickProductData] = useState({
    name: "",
    price: "",
    qty: "1",
    vat_rate: "21"
  });

  // Toggle compact cart and save preference
  const toggleCompactCart = () => {
    const newValue = !compactCart;
    setCompactCart(newValue);
    localStorage.setItem('compact_cart', newValue.toString());
  };

  // Grid size update function
  const updateGridSize = (size) => {
    setProductGridSize(size);
    localStorage.setItem('product_grid_size', size);
  };

  // Get grid classes based on size - OPTIMIZED for more products and mobile
  const getGridClasses = () => {
    switch (productGridSize) {
      case 'small':
        return 'grid-cols-3 xs:grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10';
      case 'large':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      default: // medium
        return 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7';
    }
  };

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist selected customer
  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem('pos_customer_id', selectedCustomer.id);
    } else {
      localStorage.removeItem('pos_customer_id');
    }
  }, [selectedCustomer]);

  // Load saved customer on mount
  useEffect(() => {
    const loadSavedCustomer = async () => {
      const customerId = localStorage.getItem('pos_customer_id');
      if (customerId && !selectedCustomer) {
        try {
          const res = await axios.get(`${API}/customers/${customerId}`);
          setSelectedCustomer(res.data);
        } catch (err) {
          localStorage.removeItem('pos_customer_id');
        }
      }
    };
    loadSavedCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always fetch categories
        const categoriesRes = await axios.get(`${API}/categories`);
        setCategories(categoriesRes.data);

        // Fetch ALL products for scanner and general use
        const productsRes = await axios.get(`${API}/products`);
        setAllProducts(productsRes.data);

        // Load reorder cart if exists
        const reorderCart = sessionStorage.getItem('reorder_cart');
        const reorderCustomerId = sessionStorage.getItem('reorder_customer_id');

        if (reorderCart) {
          const cartItems = JSON.parse(reorderCart);
          setCart(cartItems);
          sessionStorage.removeItem('reorder_cart');

          // Load customer if exists
          if (reorderCustomerId) {
            try {
              const customerRes = await axios.get(`${API}/customers/${reorderCustomerId}`);
              setSelectedCustomer(customerRes.data);
            } catch (err) {
              console.error("Error loading reorder customer:", err);
            }
            sessionStorage.removeItem('reorder_customer_id');
          }

          toast.success("Commande rechargée dans le panier");
        }
      } catch (error) {
        toast.error("Erreur de chargement / Laadfout");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter products for display when category or allProducts changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryProducts = allProducts.filter(p => p.category_id === selectedCategory.id);
      setProducts(categoryProducts);
      setPosViewMode("products");
    } else {
      setProducts([]);
      setPosViewMode("collections");
    }
  }, [selectedCategory, allProducts]);

  // Go back to collections view
  const goBackToCollections = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery("");
  }, []);

  // Hotkey handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F6: Cycle layout (Shift+F6 for previous)
      if (e.key === 'F6') {
        e.preventDefault();
        cycleLayout(!e.shiftKey);
        toast.info(`Mode: ${PRESET_CONFIG[currentPreset].name}`);
      }
      // Enter: Pay (if cart not empty and payment modal not open)
      // BUT: Don't trigger payment if user is editing price or discount
      if (e.key === 'Enter' && cart.length > 0 && !showPayment && !priceOverrideItem && !editingPriceId && !editingDiscountId) {
        e.preventDefault();
        setShowPayment(true);
      }
      // Delete: Remove selected item (table view)
      if (e.key === 'Delete' && selectedItemId) {
        e.preventDefault();
        removeFromCart(selectedItemId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, showPayment, priceOverrideItem, selectedItemId, cycleLayout, currentPreset, PRESET_CONFIG, editingPriceId, editingDiscountId]);

  // Filter products with useMemo for performance
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Normalize tags to array
      const tagsArray = Array.isArray(product.tags) ? product.tags :
        (product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : []);

      const matchesSearch = !searchQuery ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name_fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name_nl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.gtin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tagsArray.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Size/variant filter - extract size from product name (e.g., "Product - XL" or "Product - 50x100")
      const matchesSize = !selectedSize || (() => {
        const nameParts = product.name_fr?.split(' - ') || [];
        const variantPart = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';
        return variantPart.includes(selectedSize.toLowerCase());
      })();

      return matchesSearch && matchesSize;
    });
  }, [products, searchQuery, selectedSize]);

  // Filter categories for search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name_fr?.toLowerCase().includes(q) ||
      cat.name_nl?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // Extract available sizes/variants from products
  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    products.forEach(product => {
      const nameParts = product.name_fr?.split(' - ') || [];
      if (nameParts.length > 1) {
        const variant = nameParts[nameParts.length - 1].trim();
        // Filter out common non-size variants
        if (variant && variant.length <= 20 && !variant.toLowerCase().includes('default')) {
          sizeSet.add(variant);
        }
      }
    });
    return Array.from(sizeSet).sort();
  }, [products]);

  // Add to cart
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        // Highlight item when quantity increases
        setHighlightedItemId(product.id);
        setTimeout(() => setHighlightedItemId(null), 800);

        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      // Highlight new item
      setHighlightedItemId(product.id);
      setTimeout(() => setHighlightedItemId(null), 800);

      const itemName = language === 'nl' ? (product.name_nl || product.name_fr) : product.name_fr;

      return [...prev, {
        product_id: product.id,
        sku: product.sku,
        name: itemName,
        name_nl: product.name_nl,
        description: itemName, // Add description field for returns/credit notes
        qty: 1,
        unit_price: product.price_retail,
        unit: product.unit,
        vat_rate: product.vat_rate,
        discount_type: null,
        discount_value: 0,
        stock_qty: product.stock_qty
      }];
    });
    const itemName = language === 'nl' ? (product.name_nl || product.name_fr) : product.name_fr;
    toast.success(`${itemName} ${t('msg_save_success').toLowerCase()}`, { duration: 1500 });
  }, [language, t]);

  // Barcode scanner support (optimized for Approx and similar USB scanners)
  // Supports: EAN-13, EAN-8, UPC-A, Code128, QR codes with product ID
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout = null;
    let lastKeyTime = 0;

    // Normalize barcode: remove check digit for EAN-13, handle prefixes
    const normalizeBarcode = (barcode) => {
      // Remove any non-alphanumeric characters
      let clean = barcode.replace(/[^a-zA-Z0-9]/g, '');

      // EAN-13: Sometimes scanned with leading zeros
      if (/^\d{13}$/.test(clean)) {
        // Remove leading zeros if it's an EAN-13 with padded zeros
        clean = clean.replace(/^0+/, '') || clean;
      }

      return clean;
    };

    // Find product by barcode, GTIN, or SKU
    const findProductByBarcode = (barcode) => {
      const searchTerms = [
        barcode.toLowerCase(),
        normalizeBarcode(barcode).toLowerCase()
      ];

      // Also try without leading zeros for EAN codes
      if (/^\d+$/.test(barcode)) {
        searchTerms.push(barcode.replace(/^0+/, '').toLowerCase());
        // Try with padded zeros (to 13 digits for EAN-13)
        searchTerms.push(barcode.padStart(13, '0').toLowerCase());
      }

      return allProducts.find(p => {
        // Exact match on GTIN (from Shopify)
        if (p.gtin && searchTerms.some(term =>
          p.gtin.toLowerCase() === term ||
          p.gtin.toLowerCase().includes(term) ||
          term.includes(p.gtin.toLowerCase())
        )) {
          return true;
        }

        // Exact match on barcode field
        if (p.barcode && searchTerms.some(term =>
          p.barcode.toLowerCase() === term
        )) {
          return true;
        }

        // Exact match on SKU
        if (p.sku && searchTerms.some(term =>
          p.sku.toLowerCase() === term
        )) {
          return true;
        }

        // Partial match on SKU (for shortened barcodes)
        if (p.sku && searchTerms.some(term =>
          p.sku.toLowerCase().includes(term) ||
          term.includes(p.sku.toLowerCase())
        )) {
          return true;
        }

        return false;
      });
    };

    const processBarcode = (barcode) => {
      // Clean barcode: remove Enter, spaces, and trim
      const cleanBarcode = barcode.replace(/[\r\n\t]/g, '').trim();

      if (cleanBarcode.length >= 3) {
        const foundProduct = findProductByBarcode(cleanBarcode);

        if (foundProduct) {
          addToCart(foundProduct);
          const itemName = language === 'nl' ? (foundProduct.name_nl || foundProduct.name_fr) : foundProduct.name_fr;
          // Show product image briefly if available
          toast.success(
            <div className="flex items-center gap-2">
              {foundProduct.image_url && (
                <img src={foundProduct.image_url} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              <span>✓ {itemName}</span>
            </div>,
            { duration: 2000 }
          );
        } else {
          // Show the scanned code for debugging
          toast.error(
            <div>
              <div className="font-semibold">{t('msg_no_results')}</div>
              <div className="text-xs opacity-75 font-mono">{cleanBarcode}</div>
            </div>,
            { duration: 4000 }
          );
        }
      }
      barcodeBuffer = '';
    };

    const handleKeyDown = (e) => {
      // If input is focused, don't interfere (except for dedicated barcode input)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Allow barcode processing if it's the search field and scanner detected
        if (e.target.dataset.barcodeSearch !== 'true') {
          return;
        }
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      // Handle non-EN keyboard layouts (like FR Azerty)
      // When Shift is pressed (or Caps Lock), Azerty produces digits.
      // Many scanners simulate Shift+Digit or just send the character.
      // We map the common Azerty symbols back to digits.
      const azertyMap = {
        '&': '1', 'é': '2', '"': '3', '\'': '4', '(': '5',
        '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0'
      };

      let key = e.key;
      if (azertyMap[key]) {
        key = azertyMap[key];
      }

      // Scanner types fast (< 50ms between keys), human types slow
      // If too slow, reset buffer (likely human typing)
      // Approx scanners typically send at 10-30ms intervals
      if (timeDiff > 100 && barcodeBuffer.length > 0 && timeDiff < 1000) {
        // Might be a pause in scanning, don't reset yet
      } else if (timeDiff > 150 && barcodeBuffer.length > 0) {
        barcodeBuffer = '';
      }

      // Enter key = end of barcode scan (Approx suffix)
      if (e.key === 'Enter' && barcodeBuffer.length >= 3) {
        e.preventDefault();
        e.stopPropagation();
        processBarcode(barcodeBuffer);
        return;
      }

      // Tab key = some scanners use Tab as suffix
      if (e.key === 'Tab' && barcodeBuffer.length >= 3) {
        e.preventDefault();
        e.stopPropagation();
        processBarcode(barcodeBuffer);
        return;
      }

      // Only add printable characters (or our mapped digits)
      if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += key;

        // Clear existing timeout
        if (timeout) clearTimeout(timeout);

        // Fallback: process after 150ms of no input (faster for scanner)
        timeout = setTimeout(() => {
          if (barcodeBuffer.length >= 3) {
            processBarcode(barcodeBuffer);
          } else {
            barcodeBuffer = '';
          }
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeout) clearTimeout(timeout);
    };
  }, [allProducts, addToCart, t, language]);

  // Update cart item quantity
  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        if (newQty > item.stock_qty) {
          toast.error(`Stock insuffisant (max: ${item.stock_qty})`);
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
    if (selectedItemId === productId) {
      setSelectedItemId(null);
    }
  };

  // Get next/previous item index for keyboard navigation
  const getNextItemIndex = (currentProductId) => {
    const currentIndex = cart.findIndex(item => item.product_id === currentProductId);
    return currentIndex < cart.length - 1 ? currentIndex + 1 : 0;
  };

  const getPrevItemIndex = (currentProductId) => {
    const currentIndex = cart.findIndex(item => item.product_id === currentProductId);
    return currentIndex > 0 ? currentIndex - 1 : cart.length - 1;
  };

  // Navigate to next item's discount field
  const moveToNextDiscount = (currentProductId) => {
    const nextIndex = getNextItemIndex(currentProductId);
    const nextItem = cart[nextIndex];
    if (nextItem) {
      setEditingDiscountId(nextItem.product_id);
      // Show empty field if discount is 0, otherwise show the value
      const discountValue = nextItem.discount_value && nextItem.discount_value > 0 ? nextItem.discount_value.toString() : "";
      setTempDiscount({ type: nextItem.discount_type || "percent", value: discountValue });
      // Focus handled by CartItem effect
    }
  };

  // Navigate to next item's price field
  const moveToNextPrice = (currentProductId) => {
    const nextIndex = getNextItemIndex(currentProductId);
    const nextItem = cart[nextIndex];
    if (nextItem) {
      setEditingPriceId(nextItem.product_id);
      setTempPrice(nextItem.unit_price.toString());
      // Focus handled by CartItem effect
    }
  };

  // Update cart item price (override)
  const updateItemPrice = (productId, newPrice) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;
    setCart(prev => prev.map(item =>
      item.product_id === productId
        ? { ...item, unit_price: price, priceOverridden: true }
        : item
    ));
  };

  // Start editing price - click on price
  const startEditingPrice = (productId, currentPrice) => {
    setEditingPriceId(productId);
    setTempPrice(currentPrice.toString());
  };

  // Confirm price edit and optionally move to next
  const confirmPriceEdit = (productId, priceValue, moveToNext = false) => {
    // If called from CartItem, priceValue is passed. Fallback to state if needed (legacy safety)
    const finalPrice = priceValue !== undefined ? priceValue : tempPrice;
    updateItemPrice(productId, finalPrice);
    setEditingPriceId(null);
    setTempPrice("");
    if (moveToNext && cart.length > 1) {
      moveToNextPrice(productId);
    }
  };

  // Cancel price edit
  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setTempPrice("");
  };

  // Handle price override
  const handlePriceOverride = (newPrice, metadata) => {
    const updatedCart = cart.map(item =>
      item.product_id === priceOverrideItem.product_id
        ? {
          ...item,
          unit_price: newPrice,
          priceOverridden: true,
          overrideMetadata: metadata
        }
        : item
    );
    setCart(updatedCart);

    // Log to console (TODO: Send to backend)
    console.log('Price Override:', metadata);
    toast.success(`Prix modifié: €${newPrice.toFixed(2)}`);
  };

  // Apply line discount
  const applyLineDiscount = (productId, type, value) => {
    setCart(prev => prev.map(item =>
      item.product_id === productId
        ? { ...item, discount_type: type, discount_value: parseFloat(value) || 0 }
        : item
    ));
  };

  // Start editing item discount
  const startEditingDiscount = (productId, currentType, currentValue) => {
    setEditingDiscountId(productId);
    // Show empty field if discount is 0, otherwise show the value
    const discountValue = currentValue && currentValue > 0 ? currentValue.toString() : "";
    setTempDiscount({ type: currentType || "percent", value: discountValue });
  };

  // Confirm item discount and optionally move to next
  const confirmDiscountEdit = (productId, type, value, moveToNext = false) => {
    // Use passed values or fallback to state
    const finalType = type || tempDiscount.type;
    const finalValue = value !== undefined ? value : tempDiscount.value;

    applyLineDiscount(productId, finalType, finalValue);
    setEditingDiscountId(null);
    setTempDiscount({ type: "percent", value: "" });
    if (finalValue) {
      toast.success("Remise appliquée");
    }
    if (moveToNext && cart.length > 1) {
      moveToNextDiscount(productId);
    }
  };

  // Cancel discount edit
  const cancelDiscountEdit = () => {
    setEditingDiscountId(null);
    setTempDiscount({ type: "percent", value: "" });
  };

  // Quick add product - add a custom product to cart without existing product
  const handleQuickAddProduct = () => {
    if (!quickProductData.name || !quickProductData.price) {
      toast.error("Nom et prix requis");
      return;
    }

    const newItem = {
      product_id: `quick_${Date.now()}`,
      sku: `QUICK-${Date.now()}`,
      name: quickProductData.name,
      name_nl: quickProductData.name,
      description: quickProductData.name, // Add description field
      qty: parseInt(quickProductData.qty) || 1,
      unit_price: parseFloat(quickProductData.price),
      unit: "piece",
      vat_rate: parseFloat(quickProductData.vat_rate) || 21,
      discount_type: null,
      discount_value: 0,
      stock_qty: 999,
      isQuickAdd: true
    };

    setCart(prev => [...prev, newItem]);
    setShowQuickAddProduct(false);
    setQuickProductData({ name: "", price: "", qty: "1", vat_rate: "21" });
    toast.success(`${newItem.name} ajouté au panier`);
  };

  // Remove item discount
  const removeItemDiscount = (productId) => {
    applyLineDiscount(productId, null, 0);
    toast.success("Remise supprimée");
  };

  // Calculate line item details with VAT
  const calculateLineItem = useCallback((item) => {
    let lineSubtotal = item.qty * item.unit_price;
    let discountAmount = 0;

    if (item.discount_type === "percent") {
      discountAmount = lineSubtotal * (item.discount_value / 100);
    } else if (item.discount_type === "fixed") {
      discountAmount = item.discount_value;
    }

    const afterDiscount = lineSubtotal - discountAmount;
    const lineVat = afterDiscount * (item.vat_rate / 100);
    const lineTotal = afterDiscount + lineVat;

    return {
      subtotal: lineSubtotal,
      discount: discountAmount,
      afterDiscount,
      vat: lineVat,
      vatRate: item.vat_rate,
      total: lineTotal
    };
  }, []);

  // Calculate totals with useMemo for performance
  const totals = useMemo(() => {
    let subtotal = 0;
    let vatTotal = 0;

    cart.forEach(item => {
      let lineSubtotal = item.qty * item.unit_price;
      if (item.discount_type === "percent") {
        lineSubtotal -= lineSubtotal * (item.discount_value / 100);
      } else if (item.discount_type === "fixed") {
        lineSubtotal -= item.discount_value;
      }
      const lineVat = lineSubtotal * (item.vat_rate / 100);
      subtotal += lineSubtotal;
      vatTotal += lineVat;
    });

    // Apply global discount
    if (globalDiscount.type === "percent") {
      const discountAmount = subtotal * (globalDiscount.value / 100);
      subtotal -= discountAmount;
      vatTotal = subtotal * 0.21;
    } else if (globalDiscount.type === "fixed") {
      subtotal -= globalDiscount.value;
      vatTotal = subtotal * 0.21;
    }

    return {
      subtotal: Math.max(0, subtotal).toFixed(2),
      vatTotal: Math.max(0, vatTotal).toFixed(2),
      total: Math.max(0, subtotal + vatTotal).toFixed(2)
    };
  }, [cart, globalDiscount]);

  // Handle payment completion
  const handlePaymentComplete = async (payments) => {
    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Client walk-in",
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          description: item.description || item.name, // Ensure description is present
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate || 21
        })),
        payments: payments,
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        currency: "EUR"
      };

      // Create sale record
      const saleResponse = await axios.post(`${API}/sales`, saleData);
      const sale = saleResponse.data;

      // Create corresponding invoice document (with payment recorded)
      const documentData = {
        doc_type: "invoice",
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Client walk-in",
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          description: item.description || item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate || 21
        })),
        payments: payments, // Include payment information
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        currency: "EUR",
        status: "paid", // Mark as paid since payment is completed
        sale_id: sale.id, // Link to sale
        sale_number: sale.number // Link to sale number
      };

      const docResponse = await axios.post(`${API}/documents`, documentData);
      const document = docResponse.data;

      // Print thermal receipt automatically
      try {
        const isElectron = window.electronAPI?.isElectron;
        if (isElectron) {
          await window.electronAPI.printer.printReceipt(document);
        } else {
          await axios.post(`${API}/print/thermal`, document);
        }
      } catch (printError) {
        console.error("Thermal print failed:", printError);
        toast.error("Erreur d'impression du ticket");
      }

      toast.success(`Vente ${sale.number} enregistrée! Document ${document.number} créé!`, { duration: 3000 });

      // Reset state
      setCart([]);
      localStorage.removeItem('pos_cart');
      setSelectedCustomer(null);
      localStorage.removeItem('pos_customer_id');
      setSavedCustomerId(null);
      setGlobalDiscount({ type: null, value: 0 });
      setShowPayment(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error("Payment error:", error);
      console.error("Error response:", error.response?.data);
    }
  };

  // Save cart as Devis (Quote) - NO stock impact
  const handleSaveAsDevis = async () => {
    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    try {
      const devisData = {
        doc_type: "quote",
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Client walk-in",
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          description: item.description || item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate || 21
        })),
        payments: [], // No payments for quote
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        currency: "EUR",
        status: "draft"
      };

      const response = await axios.post(`${API}/documents`, devisData);
      const devis = response.data;

      toast.success(`Devis ${devis.number} créé!`, { duration: 3000 });

      // Reset state
      setCart([]);
      localStorage.removeItem('pos_cart');
      setSelectedCustomer(null);
      localStorage.removeItem('pos_customer_id');
      setSavedCustomerId(null);
      setGlobalDiscount({ type: null, value: 0 });

      // Navigate to document detail
      navigate(`/documents/${devis.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création du devis");
      console.error(error);
    }
  };

  // Save cart as Invoice (Facture) - WITH stock impact
  const handleSaveAsInvoice = async () => {
    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    try {
      const invoiceData = {
        doc_type: "invoice",
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Client walk-in",
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          description: item.description || item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate || 21
        })),
        payments: [], // No payments yet for invoice
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        currency: "EUR",
        status: "unpaid"
      };

      const response = await axios.post(`${API}/documents`, invoiceData);
      const invoice = response.data;

      toast.success(`Facture ${invoice.number} créée!`, { duration: 3000 });

      // Reset state
      setCart([]);
      localStorage.removeItem('pos_cart');
      setSelectedCustomer(null);
      localStorage.removeItem('pos_customer_id');
      setSavedCustomerId(null);
      setGlobalDiscount({ type: null, value: 0 });

      // Navigate to document detail
      navigate(`/documents/${invoice.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
      console.error(error);
    }
  };

  // Save as Purchase Order (Bon de commande)
  const handleSaveAsPurchaseOrder = async () => {
    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    try {
      const orderData = {
        doc_type: "purchase_order",
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate
        })),
        payments: [],
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        status: "draft"
      };

      const response = await axios.post(`${API}/documents`, orderData);
      toast.success(`Bon de commande ${response.data.number} créé!`, { duration: 3000 });

      setCart([]);
      localStorage.removeItem('pos_cart');
      setSelectedCustomer(null);
      localStorage.removeItem('pos_customer_id');
      setSavedCustomerId(null);
      setGlobalDiscount({ type: null, value: 0 });
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création du bon de commande");
      console.error(error);
    }
  };

  // Save as Delivery Note (Bon de livraison)
  const handleSaveAsDeliveryNote = async () => {
    if (cart.length === 0) {
      toast.error("Panier vide");
      return;
    }

    try {
      const deliveryData = {
        doc_type: "delivery_note",
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          vat_rate: item.vat_rate
        })),
        payments: [],
        global_discount_type: globalDiscount.type,
        global_discount_value: globalDiscount.value,
        status: "draft"
      };

      const response = await axios.post(`${API}/documents`, deliveryData);
      toast.success(`Bon de livraison ${response.data.number} créé!`, { duration: 3000 });

      setCart([]);
      localStorage.removeItem('pos_cart');
      setSelectedCustomer(null);
      localStorage.removeItem('pos_customer_id');
      setSavedCustomerId(null);
      setGlobalDiscount({ type: null, value: 0 });
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création du bon de livraison");
      console.error(error);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('pos_cart');
    setSelectedCustomer(null);
    localStorage.removeItem('pos_customer_id');
    setSavedCustomerId(null);
    setGlobalDiscount({ type: null, value: 0 });
  };

  // Apply global discount
  const handleApplyDiscount = () => {
    if (discountInput.value) {
      setGlobalDiscount({
        type: discountInput.type,
        value: parseFloat(discountInput.value)
      });
      toast.success(t('msg_save_success'));
    }
    setShowDiscountDialog(false);
  };

  // Cart component for reuse
  const CartContent = () => (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className={cn(
        "p-2 border-b",
        currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur-xl border-neutral-200/50" :
          currentDesign === DESIGNS.MINIMAL ? "bg-white border-neutral-300" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={cn(
            "font-heading font-bold text-sm",
            currentDesign === DESIGNS.MODERN ? "text-black" :
              currentDesign === DESIGNS.MINIMAL ? "text-black tracking-wider" : "text-brand-navy"
          )}>
            {t('pos_cart')}
          </h2>
          <div className="flex items-center gap-1">
            {/* Compact mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0",
                currentDesign === DESIGNS.MODERN ? "hover:bg-neutral-100 rounded-full" :
                  currentDesign === DESIGNS.MINIMAL ? "hover:bg-neutral-200 rounded-none" : ""
              )}
              onClick={toggleCompactCart}
              title={compactCart ? t('pos_normal_view') : t('pos_compact_view')}
            >
              {compactCart ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Badge
              variant="secondary"
              className={cn(
                "text-white text-xs",
                currentDesign === DESIGNS.MODERN ? "bg-black rounded-full" :
                  currentDesign === DESIGNS.MINIMAL ? "bg-black rounded-none" : ""
              )}
              style={{ backgroundColor: currentDesign === DESIGNS.CLASSIC ? colors.primary : undefined }}
            >
              {cart.length}
            </Badge>
          </div>
        </div>

        {/* Customer selection */}
        <div>
          {selectedCustomer ? (
            <div className={cn(
              "flex items-center justify-between p-1.5",
              currentDesign === DESIGNS.MODERN ? "bg-neutral-50 rounded-xl" :
                currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100 rounded-none" : "bg-slate-50 rounded"
            )}>
              <div className="flex items-center gap-1.5">
                <User className={cn(
                  "w-3 h-3",
                  currentDesign === DESIGNS.MODERN ? "text-neutral-600" :
                    currentDesign === DESIGNS.MINIMAL ? "text-black" : "text-brand-navy"
                )} />
                <span className="text-xs font-medium truncate">{selectedCustomer.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
                className="h-5 w-5 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className={cn(
                "w-full h-7 justify-start text-xs border-dashed",
                currentDesign === DESIGNS.MODERN ? "rounded-xl border-neutral-300 hover:bg-neutral-50" :
                  currentDesign === DESIGNS.MINIMAL ? "rounded-none border-neutral-400 border-2" : ""
              )}
              onClick={() => setShowCustomerSelect(true)}
              data-testid="select-customer-btn"
            >
              <User className="w-3 h-3 mr-1.5" />
              {t('customer')}
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items - COMPACT or NORMAL mode */}
      <ScrollArea className={cn(
        "flex-1",
        currentDesign === DESIGNS.MODERN ? "bg-gradient-to-b from-neutral-50/30 to-white" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-50" :
            currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-b from-yellow-50 to-white" : ""
      )}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ShoppingCart className={cn(
              "w-12 h-12 mb-3 opacity-30",
              currentDesign === DESIGNS.MODERN ? "text-neutral-400" :
                currentDesign === DESIGNS.MINIMAL ? "text-neutral-400" :
                  currentDesign === DESIGNS.LEGACY ? "text-orange-400" : ""
            )} />
            <p className="text-sm">{t('pos_empty_cart')}</p>
          </div>
        ) : (
          <div className={cn(
            compactCart ? (
              currentDesign === DESIGNS.MODERN ? "divide-y divide-neutral-100" :
                currentDesign === DESIGNS.MINIMAL ? "divide-y divide-neutral-200" :
                  "divide-y divide-slate-100"
            ) : "p-2 space-y-1"
          )}>
            {cart.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                compact={compactCart}
                highlighted={highlightedItemId === item.product_id}
                isEditingPrice={editingPriceId === item.product_id}
                isEditingDiscount={editingDiscountId === item.product_id}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onStartEditPrice={() => startEditingPrice(item.product_id, item.unit_price)}
                onConfirmPrice={(id, val, next) => confirmPriceEdit(id, val, next)} // Pass next to confirmPriceEdit
                onCancelPrice={cancelPriceEdit}
                onStartEditDiscount={() => startEditingDiscount(item.product_id, item.discount_type, item.discount_value)}
                onConfirmDiscount={(id, type, val, next) => {
                  setTempDiscount({ type, value: val }); // Sync temp state to parent before confirming
                  confirmDiscountEdit(id, type, val, next); // Pass next to confirmDiscountEdit
                }}
                onCancelDiscount={cancelDiscountEdit}
                onRemoveDiscount={removeItemDiscount}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart Footer */}
      <div className={cn(
        "p-2 border-t space-y-2",
        currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur-xl border-neutral-200/50" :
          currentDesign === DESIGNS.MINIMAL ? "bg-white border-neutral-300" : "bg-white border-slate-200"
      )}>
        {/* Quick Add Product Button */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full h-7 border-dashed text-xs",
            currentDesign === DESIGNS.MODERN
              ? "text-black hover:bg-neutral-100 border-neutral-300 rounded-full"
              : currentDesign === DESIGNS.MINIMAL
                ? "text-black hover:bg-neutral-100 border-neutral-400 rounded-none border-2"
                : "text-black hover:bg-slate-100 border border-slate-300"
          )}
          onClick={() => setShowQuickAddProduct(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          {t('pos_quick_add_title')}
        </Button>

        {/* Totals */}
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('subtotal')}</span>
            <span className="font-medium">€{totals.subtotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('vat')} (21%)</span>
            <span className="font-medium">€{totals.vatTotal}</span>
          </div>
          <Separator className={cn(
            "my-1",
            currentDesign === DESIGNS.MODERN ? "bg-purple-200" :
              currentDesign === DESIGNS.MINIMAL ? "bg-neutral-300" : ""
          )} />
          <div className={cn(
            "flex justify-between items-center text-base font-bold",
            currentDesign === DESIGNS.MODERN ? "text-black" :
              currentDesign === DESIGNS.MINIMAL ? "text-black" : "text-brand-navy"
          )}>
            <span>TOTAL</span>
            <span className="price-tag">€{totals.total}</span>
          </div>
        </div>

        {/* Global discount button - inline */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full h-7 border-dashed text-xs",
            currentDesign === DESIGNS.MODERN
              ? "text-black hover:bg-neutral-100 border-neutral-400 rounded-full"
              : currentDesign === DESIGNS.MINIMAL
                ? "text-black hover:bg-neutral-100 border-neutral-400 rounded-none border-2"
                : "text-brand-orange hover:bg-brand-orange/5"
          )}
          onClick={() => setShowDiscountDialog(true)}
          data-testid="global-discount-btn"
        >
          {t('discount').toUpperCase()}
          {globalDiscount.value > 0 && (
            <Badge className={cn(
              "ml-1.5 text-[10px] h-4",
              currentDesign === DESIGNS.MODERN ? "bg-black rounded-full" :
                currentDesign === DESIGNS.MINIMAL ? "bg-black rounded-none" : "bg-brand-orange"
            )}>
              {globalDiscount.type === "percent" ? `${globalDiscount.value}%` : `€${globalDiscount.value}`}
            </Badge>
          )}
        </Button>

        {/* Action buttons - more compact */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs",
                currentDesign === DESIGNS.MODERN ? "rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200" :
                  currentDesign === DESIGNS.MINIMAL ? "rounded-none border-2" : ""
              )}
              onClick={clearCart}
              disabled={cart.length === 0}
              data-testid="clear-cart-btn"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs col-span-2",
                    currentDesign === DESIGNS.MODERN ? "rounded-xl" :
                      currentDesign === DESIGNS.MINIMAL ? "rounded-none border-2" : ""
                  )}
                  disabled={cart.length === 0}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(
                "w-48",
                currentDesign === DESIGNS.MODERN ? "rounded-2xl shadow-xl shadow-black/10" :
                  currentDesign === DESIGNS.MINIMAL ? "rounded-none border-2 border-black" : ""
              )}>
                <DropdownMenuLabel className="text-[10px] text-muted-foreground">{t('documents_create')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSaveAsDevis} className="text-xs">
                  <FileText className="w-3 h-3 mr-2 text-black" />
                  {t('doc_quote')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAsPurchaseOrder} className="text-xs">
                  <Package className="w-3 h-3 mr-2 text-black" />
                  {t('doc_purchase_order')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSaveAsInvoice} className="text-xs">
                  <FileCheck className="w-3 h-3 mr-2 text-black" />
                  {t('doc_invoice')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAsDeliveryNote} className="text-xs">
                  <Truck className="w-3 h-3 mr-2 text-black" />
                  {t('doc_delivery_note')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            className={cn(
              "w-full pay-button h-10 text-sm font-bold",
              currentDesign === DESIGNS.MODERN
                ? "bg-gradient-to-r from-neutral-700 to-black hover:from-neutral-800 hover:to-black rounded-xl shadow-lg shadow-black/20"
                : currentDesign === DESIGNS.MINIMAL
                  ? "bg-black hover:bg-neutral-800 rounded-none"
                  : "bg-brand-orange hover:bg-brand-orange/90"
            )}
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            data-testid="pay-btn"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {t('pos_pay')}
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center h-screen",
        currentDesign === DESIGNS.MODERN ? "bg-gradient-to-br from-slate-100 via-neutral-50 to-slate-100" :
          currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" :
            currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-b from-yellow-100 to-orange-50" : "bg-brand-gray"
      )}>
        <div className="text-center">
          <div className={cn(
            "w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4",
            currentDesign === DESIGNS.MODERN ? "border-black" :
              currentDesign === DESIGNS.MINIMAL ? "border-black" :
                currentDesign === DESIGNS.LEGACY ? "border-orange-500" : "border-brand-navy"
          )}>
          </div>
          <p className="text-muted-foreground">{t('msg_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden",
      currentDesign === DESIGNS.MODERN ? "bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100" :
        currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" :
          currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-b from-yellow-100 to-orange-50" : "bg-brand-gray"
    )} data-testid="pos-screen">
      {/* Header */}
      <header
        className={cn(
          "text-white px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between z-10 shrink-0",
          currentDesign === DESIGNS.MODERN ? "bg-gradient-to-r from-slate-900 via-black to-slate-900 shadow-xl shadow-black/10" :
            currentDesign === DESIGNS.MINIMAL ? "bg-black border-b-2 border-neutral-800" :
              currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 text-black shadow-md" : "shadow-lg"
        )}
        style={{ backgroundColor: currentDesign === DESIGNS.CLASSIC ? colors.sidebar : undefined }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "flex items-center justify-center shrink-0",
            currentDesign === DESIGNS.MODERN ? "w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-neutral-600 to-black rounded-xl shadow-lg" :
              currentDesign === DESIGNS.MINIMAL ? "w-7 h-7 sm:w-9 sm:h-9 bg-white" :
                currentDesign === DESIGNS.LEGACY ? "w-7 h-7 sm:w-9 sm:h-9 bg-white rounded shadow-sm" : "w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-lg"
          )}>
            <span className={cn(
              "font-heading font-bold text-sm sm:text-base",
              currentDesign === DESIGNS.MODERN ? "text-white" :
                currentDesign === DESIGNS.MINIMAL ? "text-black" :
                  currentDesign === DESIGNS.LEGACY ? "text-orange-600" : "text-brand-navy"
            )}>A</span>
          </div>
          <div className="hidden sm:block">
            <h1 className={cn(
              "font-heading leading-tight",
              currentDesign === DESIGNS.MODERN ? "font-semibold text-sm sm:text-base" :
                currentDesign === DESIGNS.MINIMAL ? "font-normal text-sm sm:text-base tracking-widest" :
                  currentDesign === DESIGNS.LEGACY ? "font-bold text-sm sm:text-base text-black" : "font-bold text-sm sm:text-base"
            )}>ALPHA&CO</h1>
            <p className={cn(
              currentDesign === DESIGNS.MODERN ? "text-[9px] sm:text-[10px] text-purple-200" :
                currentDesign === DESIGNS.MINIMAL ? "text-[9px] sm:text-[10px] text-neutral-400 tracking-wider" :
                  currentDesign === DESIGNS.LEGACY ? "text-[9px] sm:text-[10px] text-yellow-800" : "text-[9px] sm:text-[10px] text-slate-300"
            )}>BOUWMATERIALEN & DESIGN</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Design Selector */}
          <div className="hidden md:block">
            <DesignSelector variant="ghost" size="sm" />
          </div>

          {/* Layout Selector */}
          <div className="hidden md:block">
            <LayoutSelector
              currentPreset={currentPreset}
              onSelectPreset={setCurrentPreset}
            />
          </div>

          {/* Mobile cart button */}
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                className="md:hidden relative"
                data-testid="mobile-cart-btn"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <CartContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-300">
          <span>Ninoofsesteenweg 77-79, 1700 Dilbeek</span>
          <span>TVA: BE 1028.386.674</span>
        </div>
      </header>

      {/* Main Content - Dynamic Layouts */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        style={{
          flexDirection: config.layout === 'vertical' ? 'column' : 'row'
        }}
      >
        {/* Products Section */}
        <div
          className="flex flex-col min-w-0"
          style={{
            width: config.layout === 'horizontal' ? `${cartWidth}%` : '100%',
            height: config.layout === 'vertical' ? `${cartWidth}%` : '100%',
            flex: config.layout === 'drawer' ? '1' : 'none'
          }}
        >
          {/* Search and Categories */}
          <div className={cn(
            "p-4 border-b space-y-3",
            currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur-xl border-neutral-200/50" :
              currentDesign === DESIGNS.MINIMAL ? "bg-white border-neutral-300" :
                currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300" : "bg-white border-slate-200"
          )}>
            {/* Search and Zoom Controls */}
            {/* Breadcrumb and Back Button for products view */}
            {posViewMode === "products" && selectedCategory && (
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToCollections}
                  className={cn(
                    "h-8 px-2",
                    currentDesign === DESIGNS.MODERN ? "hover:bg-purple-100 rounded-xl" :
                      currentDesign === DESIGNS.MINIMAL ? "hover:bg-neutral-200 rounded-none" :
                        currentDesign === DESIGNS.LEGACY ? "hover:bg-yellow-200 rounded" : "hover:bg-brand-orange/10"
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <button
                    onClick={goBackToCollections}
                    className={cn(
                      "flex items-center gap-1",
                      currentDesign === DESIGNS.MODERN ? "hover:text-purple-600" :
                        currentDesign === DESIGNS.MINIMAL ? "hover:text-black" :
                          currentDesign === DESIGNS.LEGACY ? "hover:text-orange-600" : "hover:text-brand-orange"
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    {t('pos_collections')}
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className={cn(
                    "font-medium",
                    currentDesign === DESIGNS.MODERN ? "text-black" :
                      currentDesign === DESIGNS.MINIMAL ? "text-black" :
                        currentDesign === DESIGNS.LEGACY ? "text-orange-800" : "text-brand-navy"
                  )}>{language === 'nl' ? (selectedCategory.name_nl || selectedCategory.name_fr) : selectedCategory.name_fr}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2",
                      currentDesign === DESIGNS.MODERN ? "bg-purple-100 text-purple-700 rounded-full" :
                        currentDesign === DESIGNS.MINIMAL ? "bg-neutral-200 text-black rounded-none" :
                          currentDesign === DESIGNS.LEGACY ? "bg-yellow-200 text-orange-800 rounded" : ""
                    )}
                  >
                    {filteredProducts.length}
                  </Badge>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
                  currentDesign === DESIGNS.MODERN ? "text-neutral-400" :
                    currentDesign === DESIGNS.MINIMAL ? "text-neutral-500" :
                      currentDesign === DESIGNS.LEGACY ? "text-orange-500" : "text-muted-foreground"
                )} />
                <Input
                  placeholder={posViewMode === "collections" ? t('search_collection') : `${t('search')} SKU, ${t('price').toLowerCase()}...`}
                  className={cn(
                    "pl-10 h-12 text-base search-input",
                    currentDesign === DESIGNS.MODERN ? "bg-purple-50/50 border-purple-200 rounded-2xl focus:ring-purple-400 focus:border-purple-400" :
                      currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100 border-neutral-300 rounded-none focus:ring-black focus:border-black" :
                        currentDesign === DESIGNS.LEGACY ? "bg-yellow-50 border-2 border-yellow-400 rounded-lg focus:ring-orange-400 focus:border-orange-400" : "bg-slate-50 border-slate-200"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="product-search"
                />
              </div>

              {/* Grid Size Selector - only show in products view */}
              {posViewMode === "products" && (
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={productGridSize === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => updateGridSize('small')}
                    title={t('pos_grid_small')}
                  >
                    <div className="grid grid-cols-3 gap-0.5 w-3 h-3">
                      {Array(9).fill(0).map((_, i) => (
                        <div key={i} className="bg-current w-0.5 h-0.5 rounded-[1px]" />
                      ))}
                    </div>
                  </Button>
                  <Button
                    variant={productGridSize === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => updateGridSize('medium')}
                    title={t('pos_grid_medium')}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-current w-1 h-1 rounded-[1px]" />
                      ))}
                    </div>
                  </Button>
                  <Button
                    variant={productGridSize === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => updateGridSize('large')}
                    title={t('pos_grid_large')}
                  >
                    <div className="w-3 h-3 bg-current rounded-[1px]" />
                  </Button>
                </div>
              )}
            </div>

            {/* Size/Variant Filter - only show in products view if sizes exist */}
            {posViewMode === "products" && availableSizes.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <Button
                  variant={selectedSize === null ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "shrink-0 h-7 text-xs",
                    currentDesign === DESIGNS.MODERN ? "rounded-full" :
                      currentDesign === DESIGNS.MINIMAL ? "rounded-none" : ""
                  )}
                  onClick={() => setSelectedSize(null)}
                >
                  {t('pos_all_sizes')}
                </Button>
                {availableSizes.slice(0, 20).map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "shrink-0 h-7 text-xs",
                      currentDesign === DESIGNS.MODERN ? "rounded-full" :
                        currentDesign === DESIGNS.MINIMAL ? "rounded-none" : "",
                      selectedSize === size && (
                        currentDesign === DESIGNS.MODERN ? "bg-purple-100 text-purple-700" :
                          currentDesign === DESIGNS.MINIMAL ? "bg-black text-white" :
                            currentDesign === DESIGNS.LEGACY ? "bg-yellow-200 text-orange-800" : "bg-brand-orange/20 text-brand-orange"
                      )
                    )}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Collections Grid - when in collections view */}
          {posViewMode === "collections" && (
            <ScrollArea className={cn(
              "flex-1 p-3",
              currentDesign === DESIGNS.MODERN ? "bg-gradient-to-b from-purple-50/30 to-transparent" :
                currentDesign === DESIGNS.MINIMAL ? "bg-neutral-50" : ""
            )}>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
                {loading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    {t('msg_loading')}
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    {searchQuery ? t('pos_no_results_collection') : t('msg_no_results')}
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onSelect={setSelectedCategory}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Products Grid - when in products view */}
          {posViewMode === "products" && (
            <ScrollArea className={cn(
              "flex-1 p-2 relative",
              currentDesign === DESIGNS.MODERN ? "bg-gradient-to-b from-purple-50/20 to-transparent" :
                currentDesign === DESIGNS.MINIMAL ? "bg-neutral-50" :
                  currentDesign === DESIGNS.LEGACY ? "bg-gradient-to-b from-yellow-50/30 to-transparent" : ""
            )}>
              {/* Subtle loading overlay when switching categories */}
              {loadingProducts && (
                <div className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center",
                  currentDesign === DESIGNS.MODERN ? "bg-white/80 backdrop-blur-sm" :
                    currentDesign === DESIGNS.MINIMAL ? "bg-white/90" :
                      currentDesign === DESIGNS.LEGACY ? "bg-yellow-50/80 backdrop-blur-sm" : "bg-white/60"
                )}>
                  <div className={cn(
                    "animate-spin h-8 w-8 border-4 border-t-transparent rounded-full",
                    currentDesign === DESIGNS.MODERN ? "border-purple-500" :
                      currentDesign === DESIGNS.MINIMAL ? "border-black" :
                        currentDesign === DESIGNS.LEGACY ? "border-orange-500" : "border-brand-orange"
                  )}>
                  </div>
                </div>
              )}
              {filteredProducts.length === 0 && !loadingProducts ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{searchQuery ? t('pos_no_results_product') : t('pos_no_products_category')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "mt-3",
                      currentDesign === DESIGNS.MODERN ? "rounded-full" :
                        currentDesign === DESIGNS.MINIMAL ? "rounded-none border-2" :
                          currentDesign === DESIGNS.LEGACY ? "rounded-lg border-2 border-yellow-400 hover:bg-yellow-100" : ""
                    )}
                    onClick={goBackToCollections}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('pos_back_to_collections')}
                  </Button>
                </div>
              ) : (
                <div className={`product-grid grid gap-2 ${getGridClasses()}`}>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      addToCart={addToCart}
                      gridSize={productGridSize}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Resizable Handle - Only for horizontal and vertical layouts */}
        {config.layout !== 'drawer' && (
          <ResizableHandle
            onResize={updateCartWidth}
            direction={config.layout === 'horizontal' ? 'vertical' : 'horizontal'}
            containerRef={containerRef}
            minPercent={config.minWidth}
            maxPercent={config.maxWidth}
          />
        )}

        {/* Cart Section - Desktop (not for drawer layout) */}
        {config.layout !== 'drawer' && (
          <div
            className="hidden md:flex border-l border-slate-200 bg-slate-50 flex-col shadow-xl"
            style={{
              width: config.layout === 'horizontal' ? `${100 - cartWidth}%` : '100%',
              height: config.layout === 'vertical' ? `${100 - cartWidth}%` : '100%'
            }}
          >
            <CartContent />
          </div>
        )}

        {/* Cart Drawer - For Focus layout */}
        {config.layout === 'drawer' && (
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-brand-orange hover:bg-brand-orange/90 z-50"
                size="icon"
              >
                <div className="relative">
                  <ShoppingCart className="w-7 h-7" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-brand-orange text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[450px] p-0">
              <CartContent />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Modals */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={parseFloat(totals.total)}
        onPaymentComplete={handlePaymentComplete}
      />

      <CustomerSelect
        open={showCustomerSelect}
        onClose={() => setShowCustomerSelect(false)}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerSelect(false);
        }}
      />

      {/* Global Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pos_percentage')} / {t('pos_fixed_amount')}</DialogTitle>
            <DialogDescription>
              {t('discount')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={discountInput.type === "percent" ? "default" : "outline"}
                style={discountInput.type === "percent" ? { backgroundColor: colors.accent } : {}}
                className={discountInput.type === "percent" ? "text-white" : ""}
                onClick={() => setDiscountInput(prev => ({ ...prev, type: "percent" }))}
              >
                {t('pos_percentage')}
              </Button>
              <Button
                variant={discountInput.type === "fixed" ? "default" : "outline"}
                style={discountInput.type === "fixed" ? { backgroundColor: colors.accent } : {}}
                className={discountInput.type === "fixed" ? "text-white" : ""}
                onClick={() => setDiscountInput(prev => ({ ...prev, type: "fixed" }))}
              >
                {t('pos_fixed_amount')}
              </Button>
            </div>
            <Input
              type="number"
              placeholder={discountInput.type === "percent" ? "Ex: 10" : "Ex: 50.00"}
              value={discountInput.value}
              onChange={(e) => setDiscountInput(prev => ({ ...prev, value: e.target.value }))}
              className="h-12 text-lg"
              data-testid="discount-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
              {t('cancel')}
            </Button>
            <Button className="bg-brand-orange hover:bg-brand-orange/90" onClick={handleApplyDiscount}>
              {t('pos_apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Product Dialog */}
      <Dialog open={showQuickAddProduct} onOpenChange={setShowQuickAddProduct}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pos_quick_add_title')}</DialogTitle>
            <DialogDescription>
              {t('pos_quick_add_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('pos_product_name')} *</label>
              <Input
                value={quickProductData.name}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Service, Frais divers..."
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('pos_unit_price')} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={quickProductData.price}
                    onChange={(e) => setQuickProductData(prev => ({ ...prev, price: e.target.value }))}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('quantity')}</label>
                <Input
                  type="number"
                  min="1"
                  value={quickProductData.qty}
                  onChange={(e) => setQuickProductData(prev => ({ ...prev, qty: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('vat')} %</label>
              <select
                className="w-full h-10 border rounded-md px-3"
                value={quickProductData.vat_rate}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, vat_rate: e.target.value }))}
              >
                <option value="21">21% (Standard)</option>
                <option value="12">12% (Réduit)</option>
                <option value="6">6% (Super réduit)</option>
                <option value="0">0% (Exonéré)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAddProduct(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-brand-orange hover:bg-brand-orange/90"
              onClick={handleQuickAddProduct}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('pos_add_to_cart')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}