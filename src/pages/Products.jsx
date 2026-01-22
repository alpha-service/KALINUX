import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Download,
  Tag,
  Weight,
  Store,
  Barcode,
  FolderOpen,
  ArrowLeft,
  Grid3X3,
  List,
  ChevronRight,
  Home,
  Layers,
  LayoutGrid,
  LayoutList,
  FolderTree,
  PackageSearch,
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const API = '/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false); // For smooth category switching
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentView, setCurrentView] = useState("collections"); // "collections" | "products" | "all"
  const [displayMode, setDisplayMode] = useState("grid"); // "grid" | "list"
  const [categoriesDisplayMode, setCategoriesDisplayMode] = useState("grid"); // "grid" | "list"
  const [viewMode, setViewMode] = useState("categories"); // "categories" | "all" - toggle between category navigation or all products
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // New category creation modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name_fr: "",
    name_nl: "",
    slug: "",
    image_url: "",
    active: true
  });

  // Image upload states
  const [imageUploadMethod, setImageUploadMethod] = useState("url"); // "url" | "upload"
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product attributes state
  const [attributes, setAttributes] = useState({
    // Dimensions
    length: "",
    length_unit: "cm",
    width: "",
    width_unit: "cm",
    height: "",
    height_unit: "cm",
    // Logistics
    volume: "",
    volume_unit: "L",
    color: "",
    material: "",
    finish: "", // mat/brillant
    shape: "",
    // Packaging
    qty_per_box: "",
    qty_per_pallet: "",
    selling_unit: "pièce", // pièce/m²/m
    // Commercial
    brand: "",
    manufacturer_ref: "",
    country_origin: "",
    warranty: "",
    hs_code: "" // customs code
  });
  const [customAttributes, setCustomAttributes] = useState([]); // [{key: "", value: ""}]

  const [formData, setFormData] = useState({
    sku: "",
    name_fr: "",
    name_nl: "",
    category_id: "",
    price_retail: "",
    price_wholesale: "",
    price_purchase: "",
    compare_at_price: "",
    stock_qty: "0",
    min_stock: "0",
    barcode: "",
    gtin: "",
    vendor: "",
    weight: "",
    weight_unit: "kg",
    description_fr: "",
    description_nl: "",
    image_url: ""
  });

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle viewMode changes
  useEffect(() => {
    if (viewMode === "all") {
      setSelectedCategory(null);
      setCurrentView("all");
      fetchAllProducts();
    } else {
      if (!selectedCategory) {
        setCurrentView("collections");
        setProducts([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // When a category is selected, load its products
  useEffect(() => {
    if (selectedCategory) {
      setCurrentView("products");
      fetchProducts(selectedCategory.id);
    } else if (viewMode === "categories") {
      setCurrentView("collections");
      setProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, viewMode]);

  // Fetch all products without category filter
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Erreur de chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId) => {
    setLoadingProducts(true); // Use lighter loading for smooth transitions
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append("category_id", categoryId);

      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Erreur de chargement");
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Select a category to view its products
  const selectCategory = (category) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  // Go back to categories list
  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setViewMode("categories");
  };

  // Switch to all products view
  const showAllProducts = () => {
    setViewMode("all");
    setSelectedCategory(null);
    setSearchQuery("");
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name_fr?.toLowerCase().includes(q) ||
      cat.name_nl?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(product => {
      const tagsArray = Array.isArray(product.tags) ? product.tags :
        (product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      return (
        product.sku?.toLowerCase().includes(q) ||
        product.name_fr?.toLowerCase().includes(q) ||
        product.name_nl?.toLowerCase().includes(q) ||
        product.barcode?.toLowerCase().includes(q) ||
        product.gtin?.toLowerCase().includes(q) ||
        product.vendor?.toLowerCase().includes(q) ||
        tagsArray.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setFormData({
      sku: "",
      name_fr: "",
      name_nl: "",
      category_id: selectedCategory?.id || null,
      price_retail: "",
      price_wholesale: "",
      price_purchase: "",
      compare_at_price: "",
      stock_qty: "0",
      min_stock: "0",
      barcode: "",
      gtin: "",
      vendor: "",
      weight: "",
      weight_unit: "kg",
      description_fr: "",
      description_nl: "",
      image_url: ""
    });
    // Reset attributes
    setAttributes({
      length: "",
      length_unit: "cm",
      width: "",
      width_unit: "cm",
      height: "",
      height_unit: "cm",
      volume: "",
      volume_unit: "L",
      color: "",
      material: "",
      finish: "",
      shape: "",
      qty_per_box: "",
      qty_per_pallet: "",
      selling_unit: "pièce",
      brand: "",
      manufacturer_ref: "",
      country_origin: "",
      warranty: "",
      hs_code: ""
    });
    setCustomAttributes([]);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setFormData({
      sku: product.sku || "",
      name_fr: product.name_fr || "",
      name_nl: product.name_nl || "",
      category_id: product.category_id || "",
      price_retail: product.price_retail || "",
      price_wholesale: product.price_wholesale || "",
      price_purchase: product.price_purchase || "",
      compare_at_price: product.compare_at_price || "",
      stock_qty: product.stock_qty || "0",
      min_stock: product.min_stock || "0",
      barcode: product.barcode || "",
      gtin: product.gtin || "",
      vendor: product.vendor || "",
      weight: product.weight || "",
      weight_unit: product.weight_unit || "kg",
      description_fr: product.description_fr || "",
      description_nl: product.description_nl || "",
      image_url: product.image_url || ""
    });

    // Load attributes from product
    const productAttrs = product.attributes || {};
    setAttributes({
      length: productAttrs.length || "",
      length_unit: productAttrs.length_unit || "cm",
      width: productAttrs.width || "",
      width_unit: productAttrs.width_unit || "cm",
      height: productAttrs.height || "",
      height_unit: productAttrs.height_unit || "cm",
      volume: productAttrs.volume || "",
      volume_unit: productAttrs.volume_unit || "L",
      color: productAttrs.color || "",
      material: productAttrs.material || "",
      finish: productAttrs.finish || "",
      shape: productAttrs.shape || "",
      qty_per_box: productAttrs.qty_per_box || "",
      qty_per_pallet: productAttrs.qty_per_pallet || "",
      selling_unit: productAttrs.selling_unit || "pièce",
      brand: productAttrs.brand || "",
      manufacturer_ref: productAttrs.manufacturer_ref || "",
      country_origin: productAttrs.country_origin || "",
      warranty: productAttrs.warranty || "",
      hs_code: productAttrs.hs_code || ""
    });

    // Load custom attributes
    const customAttrs = productAttrs.custom || [];
    setCustomAttributes(Array.isArray(customAttrs) ? customAttrs : []);

    // Set image preview if product has an image
    if (product.image_url) {
      setImagePreview(product.image_url);
      setImageUrl(product.image_url);
    } else {
      setImagePreview("");
      setImageUrl("");
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name_fr || !formData.name_fr.trim()) {
      toast.error("Le nom du produit est obligatoire");
      return;
    }

    if (!formData.price_retail || parseFloat(formData.price_retail) <= 0) {
      toast.error("Le prix de vente est obligatoire");
      return;
    }

    try {
      let categoryId = formData.category_id;

      // If creating a new category
      if (showNewCategoryInput && newCategoryName.trim()) {
        const catResponse = await axios.post(`${API}/categories`, {
          name_fr: newCategoryName.trim(),
          name_nl: newCategoryName.trim()
        });
        categoryId = catResponse.data.id;
        // Refresh categories list
        await fetchCategories();
        toast.success(`Catégorie "${newCategoryName}" créée`);
        setNewCategoryName("");
        setShowNewCategoryInput(false);
      }

      // Validate category is selected
      if (!categoryId) {
        toast.error("La catégorie est obligatoire");
        return;
      }

      let finalImageUrl = formData.image_url;

      // Handle image upload if file selected
      if (imageFile && imageUploadMethod === "upload") {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);

        setUploadingImage(true);
        const uploadResponse = await axios.post(`${API}/uploads`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadResponse.data.url;
        setUploadingImage(false);
      }
      // Handle URL import
      else if (imageUrl && imageUploadMethod === "url" && imageUrl !== formData.image_url) {
        setUploadingImage(true);
        const importResponse = await axios.post(`${API}/images/import`, { url: imageUrl });
        finalImageUrl = importResponse.data.url;
        setUploadingImage(false);
      }

      const data = {
        ...formData,
        category_id: parseInt(categoryId) || null,
        price_retail: parseFloat(formData.price_retail) || 0,
        price_wholesale: parseFloat(formData.price_wholesale) || 0,
        price_purchase: parseFloat(formData.price_purchase) || 0,
        compare_at_price: parseFloat(formData.compare_at_price) || null,
        stock_qty: parseInt(formData.stock_qty) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        weight: parseFloat(formData.weight) || null,
        image_url: finalImageUrl || null,
        // Include attributes as JSON
        attributes: {
          ...attributes,
          custom: customAttributes.filter(attr => attr.key && attr.value) // Only non-empty custom attributes
        }
      };

      console.log('Saving product with data:', data);

      let savedProduct;
      if (editingProduct) {
        const response = await axios.put(`${API}/products/${editingProduct.id}`, data);
        savedProduct = response.data;
        toast.success("Produit modifié");
      } else {
        const response = await axios.post(`${API}/products`, data);
        savedProduct = response.data;
        console.log('Product created:', response.data);
        toast.success("Produit créé");
      }

      setShowModal(false);

      // Refresh categories to update product counts
      const categoriesResponse = await axios.get(`${API}/categories`);
      setCategories(categoriesResponse.data);

      console.log('After save - viewMode:', viewMode, 'currentView:', currentView, 'selectedCategory:', selectedCategory);

      // After creating a new product, show it in the category view
      if (!editingProduct && savedProduct && savedProduct.category_id) {
        const category = categoriesResponse.data.find(c => c.id === savedProduct.category_id);
        console.log('Looking for category:', savedProduct.category_id, 'found:', category);
        if (category) {
          setSelectedCategory(category);
          setViewMode("categories");
          setCurrentView("products");
          await fetchProducts(savedProduct.category_id);
          return;
        }
      }

      // Refresh product list based on current view
      if (viewMode === "all") {
        console.log('Refreshing all products');
        await fetchAllProducts();
      } else if (selectedCategory) {
        console.log('Refreshing category products:', selectedCategory.id);
        await fetchProducts(selectedCategory.id);
      } else if (currentView === "collections") {
        console.log('In collections view, clearing products');
        // User is in collections view, products list is empty anyway
        setProducts([]);
      } else {
        console.log('No matching condition, fetching all products as fallback');
        await fetchAllProducts();
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error('Error saving product:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Supprimer ce produit ?")) return;

    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success("Produit supprimé");
      if (selectedCategory) fetchProducts(selectedCategory.id);
      else if (viewMode === "all") fetchAllProducts();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const getStockBadge = (product) => {
    if (product.stock_qty === 0) {
      return <Badge className="bg-red-100 text-red-800">Rupture</Badge>;
    } else if (product.stock_qty <= product.min_stock) {
      return <Badge className="bg-amber-100 text-amber-800">Stock bas</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">En stock</Badge>;
  };

  // Open category creation modal
  const openCategoryModal = () => {
    setCategoryFormData({
      name_fr: "",
      name_nl: "",
      slug: "",
      image_url: "",
      active: true
    });
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setShowCategoryModal(true);
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens
  };

  // Handle category creation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      let finalImageUrl = categoryFormData.image_url;

      // Handle image upload if file selected
      if (imageFile && imageUploadMethod === "upload") {
        const formData = new FormData();
        formData.append('image', imageFile);

        setUploadingImage(true);
        const uploadResponse = await axios.post(`${API}/uploads`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadResponse.data.url;
      }
      // Handle URL import
      else if (imageUrl && imageUploadMethod === "url") {
        setUploadingImage(true);
        const importResponse = await axios.post(`${API}/images/import`, { url: imageUrl });
        finalImageUrl = importResponse.data.url;
      }

      // Create category
      const response = await axios.post(`${API}/categories`, {
        ...categoryFormData,
        image_url: finalImageUrl,
        slug: categoryFormData.slug || generateSlug(categoryFormData.name_fr)
      });

      toast.success(`Catégorie "${categoryFormData.name_fr}" créée`);

      // Refresh categories and select the new one
      await fetchCategories();
      setFormData({ ...formData, category_id: response.data.id });

      setShowCategoryModal(false);
    } catch (error) {
      console.error("Category creation error:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la création");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image trop grande (max 5MB)");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL image preview
  const handleImageUrlChange = (url) => {
    setImageUrl(url);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview("");
    }
  };

  return (
    <div className="p-6" data-testid="products">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {(selectedCategory || currentView === "all") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goBackToCategories}
              className="hover:bg-brand-orange/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <button
                onClick={goBackToCategories}
                className="hover:text-brand-orange flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                {viewMode === "all" ? "Tous les produits" : "Collections"}
              </button>
              {selectedCategory && (
                <span className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-brand-navy font-medium">{selectedCategory.name_fr}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-heading font-bold text-brand-navy flex items-center gap-2">
              {currentView === "all" ? (
                <>
                  <PackageSearch className="w-6 h-6" />
                  Tous les produits / Alle producten
                </>
              ) : !selectedCategory ? (
                <>
                  <Layers className="w-6 h-6" />
                  Collections / Collecties
                </>
              ) : (
                selectedCategory.name_fr
              )}
              {(currentView === "products" || currentView === "all") && (
                <Badge variant="secondary" className="text-sm ml-2">
                  {filteredProducts.length} produit(s)
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentView === "collections"
                ? `${filteredCategories.length} catégorie(s) disponible(s)`
                : currentView === "all"
                  ? "Affichage de tous les produits"
                  : selectedCategory?.name_nl || "Produits de cette collection"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle - Categories vs All Products */}
          {currentView === "collections" && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <Button
                variant={viewMode === "categories" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("categories")}
                className={viewMode === "categories" ? "bg-brand-navy text-white" : ""}
              >
                <FolderTree className="w-4 h-4 mr-1" />
                Collections
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={showAllProducts}
                className={viewMode === "all" ? "bg-brand-navy text-white" : ""}
              >
                <PackageSearch className="w-4 h-4 mr-1" />
                Tous
              </Button>
            </div>
          )}

          {/* Categories Display Mode - Grid/List toggle for collections view */}
          {currentView === "collections" && (
            <>
              <div className="flex border rounded-md">
                <Button
                  variant={categoriesDisplayMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCategoriesDisplayMode("grid")}
                  className="rounded-r-none"
                  title="Vue grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={categoriesDisplayMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCategoriesDisplayMode("list")}
                  className="rounded-l-none"
                  title="Vue liste"
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
              <Button
                className="bg-brand-orange hover:bg-brand-orange/90"
                onClick={openCategoryModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle collection
              </Button>
            </>
          )}

          {/* Products Display Mode - for products and all views */}
          {(currentView === "products" || currentView === "all") && (
            <>
              <div className="flex border rounded-md">
                <Button
                  variant={displayMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDisplayMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={displayMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDisplayMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button className="bg-brand-orange hover:bg-brand-orange/90" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau produit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={currentView === "collections" ? "Rechercher une collection..." : "SKU, nom, code-barres, marque..."}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-products"
              />
            </div>
          </div>

          {(currentView === "products" || currentView === "all") && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Collections/Categories Grid View */}
      {currentView === "collections" && categoriesDisplayMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchQuery ? "Aucune collection trouvée" : "Aucune catégorie disponible"}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category)}
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-orange hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-colors bg-gradient-to-br from-brand-orange/10 to-brand-navy/10 group-hover:from-brand-orange/20 group-hover:to-brand-navy/20">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name_fr}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-brand-orange" />
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-brand-navy group-hover:text-brand-orange transition-colors line-clamp-2 mb-1">
                    {category.name_fr}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {category.name_nl}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {category.product_count || 0} produits
                  </Badge>
                </div>
                <div className="flex items-center justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-brand-orange flex items-center gap-1">
                    Voir produits <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Collections/Categories List View */}
      {currentView === "collections" && categoriesDisplayMode === "list" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Image</th>
                  <th className="text-left p-4 font-medium text-sm">Collection (FR)</th>
                  <th className="text-left p-4 font-medium text-sm">Collection (NL)</th>
                  <th className="text-center p-4 font-medium text-sm">Produits</th>
                  <th className="text-right p-4 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? "Aucune collection trouvée" : "Aucune catégorie disponible"}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => selectCategory(category)}
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-orange/10 to-brand-navy/10">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name_fr}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <FolderOpen className="w-6 h-6 text-brand-orange" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-brand-navy">{category.name_fr}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {category.name_nl}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary">
                          {category.product_count || 0}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-brand-orange hover:text-brand-orange hover:bg-brand-orange/10"
                        >
                          Voir <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Products Grid View */}
      {currentView === "all" && displayMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chargement des produits...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchQuery ? "Aucun produit trouvé" : "Aucun produit disponible"}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-brand-orange hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-square bg-slate-50 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_fr}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStockBadge(product)}
                  </div>
                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-mono text-muted-foreground mb-1">{product.sku}</p>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1" title={product.name_fr}>
                    {product.name_fr}
                  </h3>
                  {product.variant_title && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {product.variant_title}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-brand-navy">
                      €{product.price_retail?.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stock: {product.stock_qty}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Products List View */}
      {currentView === "all" && displayMode === "list" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Image</th>
                  <th className="text-left p-4 font-medium text-sm">SKU</th>
                  <th className="text-left p-4 font-medium text-sm">Produit</th>
                  <th className="text-left p-4 font-medium text-sm">Attributs</th>
                  <th className="text-right p-4 font-medium text-sm">Prix</th>
                  <th className="text-center p-4 font-medium text-sm">Stock</th>
                  <th className="text-center p-4 font-medium text-sm">Statut</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? "Aucun produit trouvé" : "Aucun produit disponible"}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name_fr}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{product.name_fr}</p>
                          <p className="text-xs text-muted-foreground">{product.name_nl}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {product.variant_title && (
                            <Badge variant="outline" className="text-xs">{product.variant_title}</Badge>
                          )}
                          {product.vendor && (
                            <Badge variant="secondary" className="text-xs">{product.vendor}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-brand-navy">€{product.price_retail?.toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={product.stock_qty <= product.min_stock ? "text-red-600 font-medium" : ""}>
                          {product.stock_qty}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {getStockBadge(product)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Grid View */}
      {currentView === "products" && displayMode === "grid" && (
        <div className="relative">
          {/* Subtle loading overlay when switching categories */}
          {loadingProducts && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
              <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full"></div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.length === 0 && !loadingProducts ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Aucun produit dans cette collection
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-brand-orange hover:shadow-lg transition-all duration-200"
                >
                  <div className="aspect-square bg-slate-50 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_fr}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStockBadge(product)}
                    </div>
                    {/* Quick actions overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-mono text-muted-foreground mb-1">{product.sku}</p>
                    <h3 className="font-medium text-sm line-clamp-2 mb-1" title={product.name_fr}>
                      {product.name_fr}
                    </h3>
                    {product.variant_title && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {product.variant_title}
                      </Badge>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-brand-navy">
                        €{product.price_retail?.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock_qty}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Products Table/List View */}
      {currentView === "products" && displayMode === "list" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Image</th>
                  <th className="text-left p-4 font-medium text-sm">SKU</th>
                  <th className="text-left p-4 font-medium text-sm">Produit</th>
                  <th className="text-left p-4 font-medium text-sm">Attributs</th>
                  <th className="text-right p-4 font-medium text-sm">Prix</th>
                  <th className="text-center p-4 font-medium text-sm">Stock</th>
                  <th className="text-center p-4 font-medium text-sm">Statut</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Aucun produit trouvé
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name_fr}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium">{product.sku}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{product.name_fr}</p>
                          <p className="text-sm text-muted-foreground">{product.name_nl}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.gtin && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs font-mono">
                                      <Barcode className="w-3 h-3 mr-1" />
                                      {product.gtin.length > 10 ? `...${product.gtin.slice(-8)}` : product.gtin}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>EAN/GTIN: {product.gtin}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {product.vendor && (
                              <Badge variant="secondary" className="text-xs">
                                <Store className="w-3 h-3 mr-1" />
                                {product.vendor}
                              </Badge>
                            )}
                            {product.weight && product.weight > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Weight className="w-3 h-3 mr-1" />
                                {product.weight} {product.weight_unit || 'kg'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {product.variant_title && (
                            <Badge className="text-xs bg-brand-orange/10 text-brand-orange border-0">
                              {product.variant_title}
                            </Badge>
                          )}
                          {product.size && (
                            <Badge variant="outline" className="text-xs">
                              Taille: {product.size}
                            </Badge>
                          )}
                          {product.color && (
                            <Badge variant="outline" className="text-xs">
                              {product.color}
                            </Badge>
                          )}
                          {product.material && (
                            <Badge variant="outline" className="text-xs">
                              {product.material}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-brand-navy">
                          €{product.price_retail?.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{product.stock_qty}</span>
                      </td>
                      <td className="p-4 text-center">
                        {getStockBadge(product)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} produit(s)
            </p>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifiez les informations du produit" : "Créez un nouveau produit"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gtin">EAN / GTIN</Label>
                <Input
                  id="gtin"
                  value={formData.gtin}
                  onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_fr">Nom (FR) *</Label>
                <Input
                  id="name_fr"
                  required
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name_nl">Nom (NL) *</Label>
                <Input
                  id="name_nl"
                  required
                  value={formData.name_nl}
                  onChange={(e) => setFormData({ ...formData, name_nl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.category_id ? String(formData.category_id) : undefined}
                  onValueChange={(value) => setFormData({ ...formData, category_id: parseInt(value) })}
                  className="flex-1"
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openCategoryModal}
                  className="flex-shrink-0"
                  title="Créer une nouvelle catégorie"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nouvelle
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="price_retail">Prix détail (€) *</Label>
                <Input
                  id="price_retail"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_retail}
                  onChange={(e) => setFormData({ ...formData, price_retail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="compare_at_price">Prix barré</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price_wholesale">Prix gros</Label>
                <Input
                  id="price_wholesale"
                  type="number"
                  step="0.01"
                  value={formData.price_wholesale}
                  onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price_purchase">Prix achat</Label>
                <Input
                  id="price_purchase"
                  type="number"
                  step="0.01"
                  value={formData.price_purchase}
                  onChange={(e) => setFormData({ ...formData, price_purchase: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="stock_qty">Stock</Label>
                <Input
                  id="stock_qty"
                  type="number"
                  value={formData.stock_qty}
                  onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Stock min</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weight">Poids</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weight_unit">Unité</Label>
                <Select value={formData.weight_unit} onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor">Fournisseur</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="barcode">Code-barres interne</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            {/* Product Attributes Section */}
            <div className="border-t pt-4">
              <Label className="text-lg font-semibold mb-3 block">Caractéristiques / Attributs</Label>

              {/* Dimensions */}
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-muted-foreground">Dimensions</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="length" className="text-xs">Longueur</Label>
                    <div className="flex gap-1">
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={attributes.length}
                        onChange={(e) => setAttributes({ ...attributes, length: e.target.value })}
                        className="flex-1"
                      />
                      <Select value={attributes.length_unit} onValueChange={(value) => setAttributes({ ...attributes, length_unit: value })}>
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="width" className="text-xs">Largeur</Label>
                    <div className="flex gap-1">
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={attributes.width}
                        onChange={(e) => setAttributes({ ...attributes, width: e.target.value })}
                        className="flex-1"
                      />
                      <Select value={attributes.width_unit} onValueChange={(value) => setAttributes({ ...attributes, width_unit: value })}>
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs">Hauteur</Label>
                    <div className="flex gap-1">
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={attributes.height}
                        onChange={(e) => setAttributes({ ...attributes, height: e.target.value })}
                        className="flex-1"
                      />
                      <Select value={attributes.height_unit} onValueChange={(value) => setAttributes({ ...attributes, height_unit: value })}>
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical properties */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="color" className="text-xs">Couleur</Label>
                  <Input
                    id="color"
                    placeholder="Ex: Blanc, Noir"
                    value={attributes.color}
                    onChange={(e) => setAttributes({ ...attributes, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="material" className="text-xs">Matière</Label>
                  <Input
                    id="material"
                    placeholder="Ex: Céramique, Acier"
                    value={attributes.material}
                    onChange={(e) => setAttributes({ ...attributes, material: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="finish" className="text-xs">Finition</Label>
                  <Select value={attributes.finish || "none"} onValueChange={(value) => setAttributes({ ...attributes, finish: value === "none" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="mat">Mat</SelectItem>
                      <SelectItem value="brillant">Brillant</SelectItem>
                      <SelectItem value="satin">Satiné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shape" className="text-xs">Forme</Label>
                  <Input
                    id="shape"
                    placeholder="Ex: Rectangulaire, Rond"
                    value={attributes.shape}
                    onChange={(e) => setAttributes({ ...attributes, shape: e.target.value })}
                  />
                </div>
              </div>

              {/* Commercial info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="brand" className="text-xs">Marque</Label>
                  <Input
                    id="brand"
                    placeholder="Ex: ALPHA"
                    value={attributes.brand}
                    onChange={(e) => setAttributes({ ...attributes, brand: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer_ref" className="text-xs">Référence fabricant</Label>
                  <Input
                    id="manufacturer_ref"
                    placeholder="Ex: ABC-123"
                    value={attributes.manufacturer_ref}
                    onChange={(e) => setAttributes({ ...attributes, manufacturer_ref: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country_origin" className="text-xs">Pays d'origine</Label>
                  <Input
                    id="country_origin"
                    placeholder="Ex: Belgique, Allemagne"
                    value={attributes.country_origin}
                    onChange={(e) => setAttributes({ ...attributes, country_origin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="warranty" className="text-xs">Garantie</Label>
                  <Input
                    id="warranty"
                    placeholder="Ex: 2 ans, 10 ans"
                    value={attributes.warranty}
                    onChange={(e) => setAttributes({ ...attributes, warranty: e.target.value })}
                  />
                </div>
              </div>

              {/* Packaging */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <Label htmlFor="qty_per_box" className="text-xs">Qté par boîte</Label>
                  <Input
                    id="qty_per_box"
                    type="number"
                    placeholder="0"
                    value={attributes.qty_per_box}
                    onChange={(e) => setAttributes({ ...attributes, qty_per_box: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="qty_per_pallet" className="text-xs">Qté par palette</Label>
                  <Input
                    id="qty_per_pallet"
                    type="number"
                    placeholder="0"
                    value={attributes.qty_per_pallet}
                    onChange={(e) => setAttributes({ ...attributes, qty_per_pallet: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="selling_unit" className="text-xs">Unité de vente</Label>
                  <Select value={attributes.selling_unit} onValueChange={(value) => setAttributes({ ...attributes, selling_unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pièce">Pièce</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom attributes */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Attributs personnalisés</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomAttributes([...customAttributes, { key: "", value: "" }])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {customAttributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Clé (ex: Certification)"
                      value={attr.key}
                      onChange={(e) => {
                        const newAttrs = [...customAttributes];
                        newAttrs[idx].key = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valeur (ex: CE, ISO 9001)"
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...customAttributes];
                        newAttrs[idx].value = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomAttributes(customAttributes.filter((_, i) => i !== idx))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {customAttributes.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun attribut personnalisé</p>
                )}
              </div>
            </div>

            {/* Product Image Upload */}
            <div>
              <Label>Image du produit</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageUploadMethod === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageUploadMethod("url")}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageUploadMethod === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageUploadMethod("upload")}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>

                {imageUploadMethod === "url" ? (
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="flex-1"
                    />
                    {imageFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}

                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90">
                {editingProduct ? "Sauvegarder" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Creation Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie / collection</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie pour organiser vos produits
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cat_name_fr">Nom (FR) *</Label>
                <Input
                  id="cat_name_fr"
                  required
                  value={categoryFormData.name_fr}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategoryFormData({
                      ...categoryFormData,
                      name_fr: value,
                      slug: generateSlug(value)
                    });
                  }}
                  placeholder="Ex: Carrelage"
                />
              </div>
              <div>
                <Label htmlFor="cat_name_nl">Nom (NL) *</Label>
                <Input
                  id="cat_name_nl"
                  required
                  value={categoryFormData.name_nl}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name_nl: e.target.value })}
                  placeholder="Ex: Tegels"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cat_slug">Slug (URL)</Label>
              <Input
                id="cat_slug"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                placeholder="carrelage (auto-généré)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Utilisé dans les URLs. Auto-généré depuis le nom FR.
              </p>
            </div>

            <div>
              <Label>Image de la catégorie</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageUploadMethod === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageUploadMethod("url")}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageUploadMethod === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageUploadMethod("upload")}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>

                {imageUploadMethod === "url" ? (
                  <div>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      L'image sera téléchargée sur le serveur pour éviter les liens morts
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="flex-1"
                    />
                    {imageFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}

                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat_active"
                checked={categoryFormData.active}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="cat_active" className="cursor-pointer">
                Catégorie active (visible sur le site)
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCategoryModal(false)}
                disabled={uploadingImage}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-brand-orange hover:bg-brand-orange/90"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
