import { useState, useEffect } from "react";
import axios from "axios";
import {
  Settings as SettingsIcon,
  Printer,
  Barcode,
  Globe,
  Building2,
  Bell,
  Shield,
  Database,
  ShoppingBag,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  CreditCard,
  FileText,
  Send,
  Palette,
  LayoutGrid,
  Maximize2,
  Columns,
  PanelTop,
  Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useDesign, DESIGNS, DESIGN_CONFIG } from "@/hooks/useDesign";
import { LAYOUT_PRESETS, PRESET_CONFIG, usePOSLayout } from "@/hooks/usePOSLayout";
import { cn } from "@/lib/utils";
import ThemeSelector from "@/components/ThemeSelector";

const API = '/api';

export default function Settings() {
  const [printerEnabled, setPrinterEnabled] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('checking'); // checking, connected, error
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const { currentDesign, setCurrentDesign, design, appearance, updateAppearance } = useDesign();
  const { currentPreset, setCurrentPreset } = usePOSLayout();

  // Check if running in Electron
  const isElectron = window.electronAPI?.isElectron;

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    company_name: "",
    legal_name: "",
    company_id: "",
    vat_number: "",
    peppol_id: "",
    street_name: "",
    building_number: "",
    address_line: "",
    city: "",
    postal_code: "",
    country: "BE",
    phone: "",
    email: "",
    website: "",
    bank_account_iban: "",
    bank_account_bic: "",
    bank_name: "",
    default_payment_terms_days: 30,
    invoice_footer_text: "",
    quote_footer_text: ""
  });
  const [companyLoading, setCompanyLoading] = useState(true);

  // Peppyrus/Peppol Settings
  const [peppyrusSettings, setPeppyrusSettings] = useState({
    enabled: false,
    api_key: "",
    api_secret: "",
    api_url: "https://api.peppyrus.be",
    sender_id: "",
    test_mode: true,
    auto_send_invoices: false
  });
  const [peppyrusLoading, setPeppyrusLoading] = useState(true);
  const [peppolTestResult, setPeppolTestResult] = useState(null);

  // Shopify state
  const [shopifySettings, setShopifySettings] = useState({
    enabled: false,
    shop_url: "",
    access_token: "",
    api_key: "",
    api_secret: "",
    auto_sync: false,
    sync_interval_minutes: 30,
    last_sync: null
  });
  const [shopifyLoading, setShopifyLoading] = useState(true);
  const [syncLogs, setSyncLogs] = useState([]);
  const [unmappedProducts, setUnmappedProducts] = useState([]);
  const [showSyncLogs, setShowSyncLogs] = useState(false);

  useEffect(() => {
    loadCompanySettings();
    loadPeppyrusSettings();
    loadShopifySettings();
    loadSyncLogs();
    loadUnmappedProducts();
  }, []);

  // Detect available printers (Electron only)
  useEffect(() => {
    const isElectron = window.electronAPI?.isElectron;
    if (isElectron && printerEnabled) {
      const detectPrinters = async () => {
        try {
          setPrinterStatus('checking');
          const result = await window.electronAPI.printer.listUSB();
          
          if (result.success) {
            setAvailablePrinters(result.printers);
            setPrinterStatus(result.printers.length > 0 ? 'connected' : 'error');
            if (result.printers.length > 0) {
              setSelectedPrinter(result.printers[0]);
            }
          } else {
            setPrinterStatus('error');
            console.error('Printer detection failed:', result.error);
          }
        } catch (error) {
          setPrinterStatus('error');
          console.error('Error detecting printers:', error);
        }
      };
      
      detectPrinters();
    }
  }, [printerEnabled]);

  const loadCompanySettings = async () => {
    try {
      const response = await axios.get(`${API}/company-settings`);
      if (response.data) {
        setCompanySettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
    } finally {
      setCompanyLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    try {
      console.log("Saving company settings:", companySettings);
      const response = await axios.put(`${API}/company-settings`, companySettings);
      console.log("Save response:", response.data);
      toast.success("Paramètres entreprise sauvegardés");
    } catch (error) {
      console.error("Error saving company settings:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Erreur lors de la sauvegarde");
    }
  };

  const loadPeppyrusSettings = async () => {
    try {
      const response = await axios.get(`${API}/peppyrus-settings`);
      if (response.data) {
        setPeppyrusSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error loading Peppyrus settings:", error);
    } finally {
      setPeppyrusLoading(false);
    }
  };

  const savePeppyrusSettings = async () => {
    try {
      console.log("Saving Peppyrus settings:", peppyrusSettings);
      const response = await axios.put(`${API}/peppyrus-settings`, peppyrusSettings);
      console.log("Save response:", response.data);
      toast.success("Paramètres Peppol sauvegardés");
    } catch (error) {
      console.error("Error saving Peppyrus settings:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Erreur lors de la sauvegarde");
    }
  };

  const testPeppolConnection = async () => {
    setPeppolTestResult({ status: "testing" });
    try {
      // Send current settings to backend for testing (allows testing without saving first)
      const response = await axios.post(`${API}/peppol/test-connection`, {
        api_key: peppyrusSettings.api_key,
        api_secret: peppyrusSettings.api_secret,
        test_mode: peppyrusSettings.test_mode
      });

      setPeppolTestResult(response.data);
      if (response.data.success) {
        toast.success("Connexion Peppol réussie!");
      } else {
        toast.error(response.data.message || "Erreur de connexion");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Erreur de connexion";
      setPeppolTestResult({ status: "error", message: errorMsg });
      toast.error(errorMsg);
    }
  };

  const loadShopifySettings = async () => {
    try {
      const response = await axios.get(`${API}/shopify-settings`);
      if (response.data) {
        setShopifySettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error loading Shopify settings:", error);
    } finally {
      setShopifyLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await axios.get(`${API}/shopify/sync-logs?limit=10`);
      setSyncLogs(response.data);
    } catch (error) {
      console.error("Error loading sync logs:", error);
    }
  };

  const loadUnmappedProducts = async () => {
    try {
      const response = await axios.get(`${API}/shopify/unmapped-products`);
      setUnmappedProducts(response.data);
    } catch (error) {
      console.error("Error loading unmapped products:", error);
    }
  };

  const handleShopifySettingsChange = (field, value) => {
    setShopifySettings(prev => ({ ...prev, [field]: value }));
  };

  const saveShopifySettings = async () => {
    try {
      console.log("Saving Shopify settings:", shopifySettings);
      const response = await axios.put(`${API}/shopify-settings`, shopifySettings);
      console.log("Save response:", response.data);
      toast.success("Paramètres Shopify sauvegardés");
      loadShopifySettings();
    } catch (error) {
      console.error("Error saving Shopify settings:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Erreur lors de la sauvegarde");
    }
  };

  // Printer functions
  const handleTestPrinter = async () => {
    try {
      const result = await window.electronAPI.printer.test();
      if (result.success) {
        toast.success("Test d'impression réussi!");
      } else {
        toast.error(result.error || "Échec du test d'impression");
      }
    } catch (error) {
      toast.error("Erreur lors du test d'impression");
      console.error(error);
    }
  };

  const handleSyncProducts = async () => {
    // Check if Shopify credentials are configured first
    if (!shopifySettings?.shop_url || !shopifySettings?.access_token) {
      toast.error(
        "Veuillez configurer les identifiants Shopify avant de synchroniser les produits",
        { duration: 5000 }
      );
      return;
    }

    toast.info("Synchronisation des produits...");
    try {
      const response = await axios.post(`${API}/shopify/sync/products`);
      console.log('Sync response:', response.data);
      const imported = response.data.items_succeeded || 0;
      if (imported > 0) {
        toast.success(`${imported} produit(s) importé(s) ! Allez dans Inventory pour les voir.`, { duration: 5000 });
      } else {
        toast.info("Aucun nouveau produit à importer (déjà présents)");
      }
      loadSyncLogs();
      loadUnmappedProducts();
    } catch (error) {
      console.error('Shopify sync error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.log?.details?.message || error.message;
      toast.error(`Erreur lors de l'import: ${errorMsg}`, { duration: 5000 });
    }
  };

  const handleSyncStock = async () => {
    toast.info("Synchronisation du stock...");
    try {
      const response = await axios.post(`${API}/shopify/sync/stock`);
      toast.success(`Stock synchronisé: ${response.data.items_synced} produits`);
      loadSyncLogs();
    } catch (error) {
      toast.error("Erreur lors de la synchro stock");
    }
  };

  const handleSyncOrders = async () => {
    toast.info("Import des commandes...");
    try {
      await axios.post(`${API}/shopify/sync/orders`);
      toast.success("Commandes importées");
      loadSyncLogs();
    } catch (error) {
      toast.error("Erreur lors de l'import");
    }
  };

  const handleSave = () => {
    toast.success("Paramètres sauvegardés");
  };

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6" data-testid="settings">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-navy">
          Paramètres / Instellingen
        </h1>
        <p className="text-muted-foreground mt-1">
          Configuration du système POS
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="peppol" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Peppol</span>
          </TabsTrigger>
          <TabsTrigger value="shopify" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Shopify</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Matériel</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Identity */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Identité entreprise</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom commercial</label>
                  <Input
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="ALPHA&CO BVBA"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Raison sociale (légale)</label>
                  <Input
                    value={companySettings.legal_name || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, legal_name: e.target.value }))}
                    placeholder="ALPHA&CO BOUWMATERIALEN & DESIGN BVBA"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">N° BCE/KBO</label>
                    <Input
                      value={companySettings.company_id || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, company_id: e.target.value }))}
                      placeholder="0123.456.789"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">N° TVA</label>
                    <Input
                      value={companySettings.vat_number || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, vat_number: e.target.value }))}
                      placeholder="BE0123456789"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Peppol ID</label>
                  <Input
                    value={companySettings.peppol_id || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, peppol_id: e.target.value }))}
                    placeholder="0208:BE0123456789"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: 0208:BE + numéro TVA sans espaces</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Adresse</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">Rue</label>
                    <Input
                      value={companySettings.street_name || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, street_name: e.target.value }))}
                      placeholder="Ninoofsesteenweg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">N°</label>
                    <Input
                      value={companySettings.building_number || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, building_number: e.target.value }))}
                      placeholder="77-79"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Code postal</label>
                    <Input
                      value={companySettings.postal_code || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="1700"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">Ville</label>
                    <Input
                      value={companySettings.city || ""}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Dilbeek"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pays</label>
                  <Input
                    value={companySettings.country || "BE"}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="BE"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Contact</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone</label>
                  <Input
                    value={companySettings.phone || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+32 2 123 45 67"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    value={companySettings.email || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@alpha-co.be"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Site web</label>
                  <Input
                    value={companySettings.website || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.alpha-co.be"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Coordonnées bancaires</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">IBAN</label>
                  <Input
                    value={companySettings.bank_account_iban || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_account_iban: e.target.value }))}
                    placeholder="BE68 5390 0754 7034"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">BIC/SWIFT</label>
                  <Input
                    value={companySettings.bank_account_bic || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_account_bic: e.target.value }))}
                    placeholder="TRIOBEBBXXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom de la banque</label>
                  <Input
                    value={companySettings.bank_name || ""}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Belfius"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Délai de paiement par défaut (jours)</label>
                  <Input
                    type="number"
                    value={companySettings.default_payment_terms_days || 30}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, default_payment_terms_days: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveCompanySettings} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Sauvegarder les paramètres
            </Button>
          </div>
        </TabsContent>

        {/* Peppol/Peppyrus Settings Tab */}
        <TabsContent value="peppol">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peppyrus API */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Peppyrus API (Peppol Belgique)</h2>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Activer Peppol</p>
                  <p className="text-sm text-muted-foreground">Envoi automatique des factures via Peppol</p>
                </div>
                <Switch
                  checked={peppyrusSettings.enabled}
                  onCheckedChange={(checked) => setPeppyrusSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">URL API Peppyrus</label>
                  <Input
                    value={peppyrusSettings.api_url}
                    onChange={(e) => setPeppyrusSettings(prev => ({ ...prev, api_url: e.target.value }))}
                    placeholder="https://api.peppyrus.be"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Clé API</label>
                  <Input
                    value={peppyrusSettings.api_key || ""}
                    onChange={(e) => setPeppyrusSettings(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="pk_live_..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Secret API</label>
                  <Input
                    type="password"
                    value={peppyrusSettings.api_secret || ""}
                    onChange={(e) => setPeppyrusSettings(prev => ({ ...prev, api_secret: e.target.value }))}
                    placeholder="sk_live_..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sender ID (Peppol)</label>
                  <Input
                    value={peppyrusSettings.sender_id || ""}
                    onChange={(e) => setPeppyrusSettings(prev => ({ ...prev, sender_id: e.target.value }))}
                    placeholder="0208:BE0123456789"
                  />
                </div>
              </div>
            </div>

            {/* Peppol Options */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Send className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Options d'envoi</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Mode test (Sandbox)</p>
                    <p className="text-sm text-muted-foreground">Utiliser l'environnement de test</p>
                  </div>
                  <Switch
                    checked={peppyrusSettings.test_mode}
                    onCheckedChange={(checked) => setPeppyrusSettings(prev => ({ ...prev, test_mode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Envoi automatique</p>
                    <p className="text-sm text-muted-foreground">Envoyer automatiquement les factures après création</p>
                  </div>
                  <Switch
                    checked={peppyrusSettings.auto_send_invoices}
                    onCheckedChange={(checked) => setPeppyrusSettings(prev => ({ ...prev, auto_send_invoices: checked }))}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={testPeppolConnection}
                    className="w-full"
                    disabled={!peppyrusSettings.api_key}
                  >
                    {peppolTestResult?.status === "testing" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Tester la connexion
                  </Button>

                  {peppolTestResult && peppolTestResult.status !== "testing" && (
                    <div className={`p-3 rounded-lg text-sm ${peppolTestResult.status === "connected"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                      {peppolTestResult.status === "connected" ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Connexion réussie à Peppyrus!
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          {peppolTestResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Prérequis Peppol Belgique</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Numéro BCE/KBO valide</li>
                    <li>Numéro TVA belge actif</li>
                    <li>Compte Peppyrus ou autre Access Point</li>
                    <li>Format facture: UBL 2.1 / Peppol BIS 3.0</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={savePeppyrusSettings} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Sauvegarder configuration Peppol
            </Button>
          </div>
        </TabsContent>

        {/* Shopify Tab */}
        <TabsContent value="shopify">
          <div className="grid grid-cols-1 gap-6">
            {/* Shopify Integration */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-brand-navy" />
                  <h2 className="font-heading font-bold">Shopify Integration</h2>
                </div>
                {shopifySettings && (
                  <Badge className={shopifySettings.auto_sync_enabled ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                    {shopifySettings.auto_sync_enabled ? "Sync Auto" : "Sync Manuel"}
                  </Badge>
                )}
              </div>

              {shopifyLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <div className="space-y-6">
                  {/* Connection Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Store Domain</label>
                      <Input
                        placeholder="yourstore.myshopify.com"
                        value={shopifySettings?.shop_url || ""}
                        onChange={(e) => handleShopifySettingsChange("shop_url", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Access Token (Admin API)</label>
                      <Input
                        type="password"
                        placeholder="shpat_..."
                        value={shopifySettings?.access_token || ""}
                        onChange={(e) => handleShopifySettingsChange("access_token", e.target.value)}
                      />
                    </div>
                    <Button onClick={saveShopifySettings} variant="outline" size="sm">
                      Sauvegarder la configuration
                    </Button>
                  </div>

                  {/* Warning banner when credentials are missing */}
                  {(!shopifySettings?.shop_url || !shopifySettings?.access_token) && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-900 mb-1">Configuration requise</h4>
                          <p className="text-sm text-amber-800 mb-2">
                            Veuillez saisir votre domaine Shopify et votre token d'accès Admin API pour activer l'intégration.
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 ml-2">
                            <li>• Domaine: yourstore.myshopify.com</li>
                            <li>• Token: shpat_xxxxxxxxxxxxxxxx</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Sync Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Import Produits</p>
                        <p className="text-sm text-muted-foreground">Importer produits depuis Shopify vers POS</p>
                      </div>
                      <Switch
                        checked={shopifySettings?.import_products_enabled || false}
                        onCheckedChange={(checked) => {
                          handleShopifySettingsChange("import_products_enabled", checked);
                          saveShopifySettings();
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Export Stock</p>
                        <p className="text-sm text-muted-foreground">Pousser les stocks POS vers Shopify</p>
                      </div>
                      <Switch
                        checked={shopifySettings?.export_stock_enabled || false}
                        onCheckedChange={(checked) => {
                          handleShopifySettingsChange("export_stock_enabled", checked);
                          saveShopifySettings();
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Import Commandes</p>
                        <p className="text-sm text-muted-foreground">Importer commandes Shopify comme ventes</p>
                      </div>
                      <Switch
                        checked={shopifySettings?.import_orders_enabled || false}
                        onCheckedChange={(checked) => {
                          handleShopifySettingsChange("import_orders_enabled", checked);
                          saveShopifySettings();
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Synchronisation automatique</p>
                        <p className="text-sm text-muted-foreground">
                          Sync tous les {shopifySettings?.sync_interval_minutes || 10} minutes
                        </p>
                      </div>
                      <Switch
                        checked={shopifySettings?.auto_sync_enabled || false}
                        onCheckedChange={(checked) => {
                          handleShopifySettingsChange("auto_sync_enabled", checked);
                          saveShopifySettings();
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Import Info Card */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">📦 Données importées de Shopify</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>• SKU / Code produit</div>
                      <div>• Barcode / EAN / GTIN</div>
                      <div>• Prix de vente</div>
                      <div>• Prix comparé (barré)</div>
                      <div>• Stock disponible</div>
                      <div>• Poids et unité</div>
                      <div>• Fournisseur / Vendor</div>
                      <div>• Tags produit</div>
                      <div>• Type de produit</div>
                      <div>• Images produit</div>
                    </div>
                  </div>

                  {/* Manual Sync Actions */}
                  <div>
                    <h3 className="font-medium mb-3">Actions manuelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleSyncProducts}
                        disabled={!shopifySettings?.shop_url || !shopifySettings?.access_token}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Import Produits
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleSyncStock}
                        disabled={!shopifySettings?.shop_url || !shopifySettings?.access_token}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Push Stock
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleSyncOrders}
                        disabled={!shopifySettings?.shop_url || !shopifySettings?.access_token}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Import Commandes
                      </Button>
                    </div>

                    {/* Disabled state explanation */}
                    {(!shopifySettings?.shop_url || !shopifySettings?.access_token) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Les actions sont désactivées. Configurez d'abord les identifiants Shopify.
                      </p>
                    )}
                  </div>

                  {/* Last Sync Info */}
                  {shopifySettings && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h3 className="font-medium text-sm mb-2">Dernières synchronisations</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Produits:</span>
                          <span>{shopifySettings.last_product_sync ? new Date(shopifySettings.last_product_sync).toLocaleString("fr-BE") : "Jamais"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock:</span>
                          <span>{shopifySettings.last_stock_sync ? new Date(shopifySettings.last_stock_sync).toLocaleString("fr-BE") : "Jamais"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commandes:</span>
                          <span>{shopifySettings.last_order_sync ? new Date(shopifySettings.last_order_sync).toLocaleString("fr-BE") : "Jamais"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unmapped Products Alert */}
                  {unmappedProducts.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <p className="font-medium">{unmappedProducts.length} produits non mappés</p>
                          <p className="text-sm">Ces produits Shopify n'ont pas pu être automatiquement importés (SKU/code-barres manquant ou dupliqué)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sync Logs Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSyncLogs(!showSyncLogs)}
                    className="w-full"
                  >
                    {showSyncLogs ? "Masquer" : "Afficher"} les logs de synchronisation ({syncLogs.length})
                  </Button>

                  {/* Sync Logs */}
                  {showSyncLogs && syncLogs.length > 0 && (
                    <div className="space-y-2">
                      {syncLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getSyncStatusIcon(log.status)}
                              <span className="font-medium">{log.sync_type}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString("fr-BE")}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            {log.items_processed > 0 ? (
                              <span>{log.items_processed} traités • {log.items_succeeded} réussis • {log.items_failed} échecs</span>
                            ) : (
                              <span>{log.details?.message || "En attente"}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 gap-6">
            {/* Design Mode Selection */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-brand-navy" />
                <div>
                  <h2 className="font-heading font-bold">Mode d'affichage / Weergavemodus</h2>
                  <p className="text-sm text-muted-foreground">Changez l'apparence complète du POS</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Classic Design */}
                <button
                  onClick={() => setCurrentDesign(DESIGNS.CLASSIC)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    currentDesign === DESIGNS.CLASSIC
                      ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {currentDesign === DESIGNS.CLASSIC && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-brand-orange" />
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-4 h-4 rounded bg-[#1a365d]" />
                    <div className="w-4 h-4 rounded bg-[#e67e22]" />
                    <div className="w-4 h-4 rounded bg-slate-100" />
                  </div>
                  <h3 className="font-bold text-brand-navy mb-1">{DESIGN_CONFIG[DESIGNS.CLASSIC].name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{DESIGN_CONFIG[DESIGNS.CLASSIC].description}</p>
                </button>

                {/* Modern Design */}
                <button
                  onClick={() => setCurrentDesign(DESIGNS.MODERN)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    currentDesign === DESIGNS.MODERN
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {currentDesign === DESIGNS.MODERN && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-purple-600" />
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div className="w-4 h-4 rounded-full bg-slate-800" />
                    <div className="w-4 h-4 rounded-full bg-purple-100" />
                  </div>
                  <h3 className="font-bold text-purple-900 mb-1">{DESIGN_CONFIG[DESIGNS.MODERN].name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{DESIGN_CONFIG[DESIGNS.MODERN].description}</p>
                </button>

                {/* Minimal Design */}
                <button
                  onClick={() => setCurrentDesign(DESIGNS.MINIMAL)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    currentDesign === DESIGNS.MINIMAL
                      ? "border-black bg-neutral-50 ring-2 ring-black/10"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {currentDesign === DESIGNS.MINIMAL && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-black" />
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-4 h-4 bg-black" />
                    <div className="w-4 h-4 bg-neutral-500" />
                    <div className="w-4 h-4 bg-neutral-200" />
                  </div>
                  <h3 className="font-bold text-black mb-1">{DESIGN_CONFIG[DESIGNS.MINIMAL].name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{DESIGN_CONFIG[DESIGNS.MINIMAL].description}</p>
                </button>

                {/* Custom Design */}
                <button
                  onClick={() => setCurrentDesign(DESIGNS.CUSTOM)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    currentDesign === DESIGNS.CUSTOM
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {currentDesign === DESIGNS.CUSTOM && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-blue-600" />
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-blue-400" />
                    <div className="w-4 h-4 rounded-sm border-2 border-dashed border-blue-400" />
                    <div className="w-4 h-4 rounded-none border-2 border-dashed border-blue-400" />
                  </div>
                  <h3 className="font-bold text-blue-900 mb-1">Custom</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">Configuration avancée</p>
                </button>
              </div>

              {/* Customization Controls (Only visible in Custom Mode) */}
              {currentDesign === DESIGNS.CUSTOM && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in slide-in-from-top-4 fade-in duration-300">
                  <h3 className="font-bold text-brand-navy mb-4">Personnalisation avancée</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Density Control */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Densité de l'interface</label>
                      <div className="flex p-1 bg-slate-100 rounded-lg">
                        {['compact', 'comfortable', 'spacious'].map((d) => (
                          <button
                            key={d}
                            onClick={() => updateAppearance('density', d)}
                            className={cn(
                              "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all capitalize",
                              appearance.density === d
                                ? "bg-white text-brand-navy shadow-sm"
                                : "text-muted-foreground hover:text-brand-navy"
                            )}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajuste l'espacement dans les listes et grilles.
                      </p>
                    </div>

                    {/* Radius Control */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Arrondis (Radius)</label>
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Carré</span>
                          <span>Rond</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.25"
                          value={parseFloat(appearance.radius) || 0}
                          onChange={(e) => updateAppearance('radius', `${e.target.value}rem`)}
                          className="w-full"
                        />
                        <div className="flex justify-center">
                          <div
                            className="w-12 h-12 border-2 border-brand-navy bg-brand-navy/10 transition-all duration-300"
                            style={{ borderRadius: appearance.radius }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shadows Control */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Ombres & Profondeur</label>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-sm">Activer les ombres</div>
                        <Switch
                          checked={appearance.shadows === 'enabled'}
                          onCheckedChange={(checked) => updateAppearance('shadows', checked ? 'enabled' : 'disabled')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* POS Layout Configuration */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <LayoutGrid className="w-5 h-5 text-brand-navy" />
                <div>
                  <h2 className="font-heading font-bold">Disposition du Point de Vente</h2>
                  <p className="text-sm text-muted-foreground">Choisissez comment l'écran de caisse est organisé</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Object.values(LAYOUT_PRESETS).map((presetId) => {
                  const config = PRESET_CONFIG[presetId];
                  const Icon = config.icon === 'LayoutGrid' ? LayoutGrid :
                    config.icon === 'Maximize2' ? Maximize2 :
                      config.icon === 'Columns' ? Columns :
                        config.icon === 'PanelTop' ? PanelTop : Maximize;
                  const isActive = currentPreset === presetId;

                  return (
                    <button
                      key={presetId}
                      onClick={() => setCurrentPreset(presetId)}
                      className={cn(
                        "relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all",
                        isActive
                          ? "border-brand-orange bg-orange-50/50 ring-1 ring-brand-orange/20"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-orange" />
                      )}

                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                        isActive ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20" : "bg-slate-100 text-slate-500"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <h3 className={cn("font-bold text-sm mb-1", isActive ? "text-brand-navy" : "text-slate-700")}>
                        {config.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground leading-snug max-w-[120px]">
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-heading font-bold mb-4">Aperçu du design actuel</h3>
              <div className={cn(
                "p-6 rounded-xl",
                currentDesign === DESIGNS.MODERN
                  ? "bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100"
                  : currentDesign === DESIGNS.MINIMAL
                    ? "bg-neutral-100"
                    : "bg-brand-gray"
              )}>
                <div className={cn(
                  "p-4 mb-4",
                  currentDesign === DESIGNS.MODERN
                    ? "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl text-white"
                    : currentDesign === DESIGNS.MINIMAL
                      ? "bg-black text-white"
                      : "bg-brand-navy rounded-lg text-white"
                )}>
                  <span className="font-bold">En-tête exemple</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className={cn(
                    "p-4 text-center",
                    currentDesign === DESIGNS.MODERN
                      ? "bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50"
                      : currentDesign === DESIGNS.MINIMAL
                        ? "bg-white border-2 border-neutral-200"
                        : "bg-white rounded-xl border border-slate-200"
                  )}>
                    <div className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      currentDesign === DESIGNS.MODERN ? "bg-purple-100 rounded-xl" :
                        currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" : "bg-brand-orange/10 rounded-lg"
                    )} />
                    <span className="text-xs">Produit</span>
                  </div>
                  <div className={cn(
                    "p-4 text-center",
                    currentDesign === DESIGNS.MODERN
                      ? "bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50"
                      : currentDesign === DESIGNS.MINIMAL
                        ? "bg-white border-2 border-neutral-200"
                        : "bg-white rounded-xl border border-slate-200"
                  )}>
                    <div className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      currentDesign === DESIGNS.MODERN ? "bg-purple-100 rounded-xl" :
                        currentDesign === DESIGNS.MINIMAL ? "bg-neutral-100" : "bg-brand-orange/10 rounded-lg"
                    )} />
                    <span className="text-xs">Produit</span>
                  </div>
                  <Button className={cn(
                    "h-auto py-3",
                    currentDesign === DESIGNS.MODERN
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"
                      : currentDesign === DESIGNS.MINIMAL
                        ? "bg-black rounded-none"
                        : "bg-brand-orange"
                  )}>
                    Payer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Hardware Tab */}
        <TabsContent value="hardware">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Printer */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Printer className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Imprimante tickets</h2>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Activer ESC/POS</p>
                  <p className="text-sm text-muted-foreground">Impression thermique USB/Réseau</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isElectron ? (
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      Non disponible
                    </Badge>
                  ) : printerStatus === 'checking' ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Détection...
                    </Badge>
                  ) : printerStatus === 'connected' ? (
                    <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      Erreur
                    </Badge>
                  )}
                  <Switch 
                    checked={printerEnabled} 
                    onCheckedChange={setPrinterEnabled} 
                    disabled={!isElectron}
                  />
                </div>
              </div>

              {printerEnabled && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>✅ ESC/POS activé:</strong> Impression RAW USB/Réseau
                  </p>
                  {availablePrinters.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-blue-900 mb-1 block">
                          Imprimante détectée:
                        </label>
                        <div className="p-2 bg-white rounded border text-sm font-mono">
                          VID: 0x{selectedPrinter?.vendorId?.toString(16).toUpperCase()} | 
                          PID: 0x{selectedPrinter?.productId?.toString(16).toUpperCase()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleTestPrinter}>
                        Tester l'impression
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Aucune imprimante USB détectée. Connectez votre imprimante thermique.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Barcode Scanner */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Barcode className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Scanner code-barres</h2>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Mode clavier HID</p>
                  <p className="text-sm text-muted-foreground">Scanner USB Approx</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Actif</Badge>
                  <Switch checked={scannerEnabled} onCheckedChange={setScannerEnabled} />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-2">
                  <strong>✓ Scanner configuré:</strong> Mode clavier activé
                </p>
                <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                  <li>Supporte EAN-13, EAN-8, UPC-A, Code128</li>
                  <li>Détection automatique Enter suffix</li>
                  <li>Ajout automatique au panier depuis POS</li>
                  <li>Recherche par SKU, barcode ou GTIN</li>
                </ul>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-brand-navy" />
                <h2 className="font-heading font-bold">Système</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Version</p>
                  <p className="font-mono font-bold">2.1.0</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Base de données</p>
                  <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Backend API</p>
                  <Badge className="bg-green-100 text-green-800">En ligne</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Format numérotation</p>
                  <p className="font-mono">YYMMDD-XXX</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-sm mb-3">Préfixes documents</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Devis</span>
                    <span className="font-mono font-bold">DV</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Facture</span>
                    <span className="font-mono font-bold">FA</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Ticket</span>
                    <span className="font-mono font-bold">RC</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded border">
                    <span>Avoir</span>
                    <span className="font-mono font-bold">CN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
