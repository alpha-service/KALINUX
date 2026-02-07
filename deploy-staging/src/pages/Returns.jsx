import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, Package, CheckCircle, Clock, XCircle, ChevronDown, FileText, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

const API = '/api';

const STATUS_CONFIG = {
  draft: { label: "Brouillon", icon: Clock, color: "bg-slate-100 text-slate-700" },
  validated: { label: "Validé", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", icon: XCircle, color: "bg-red-100 text-red-700" },
};

export default function Returns() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnLines, setReturnLines] = useState([]);
  const [returnReason, setReturnReason] = useState("");
  const [searchingInvoice, setSearchingInvoice] = useState(false);

  // New state for improved invoice search
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchAvailableInvoices();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await axios.get(`${API}/returns`);
      setReturns(response.data);
    } catch (error) {
      console.error("Error fetching returns:", error);
      toast.error("Erreur lors du chargement des retours");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all paid invoices for autocomplete
  const fetchAvailableInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await axios.get(`${API}/documents?doc_type=invoice&limit=500`);
      // Filter only paid/partially_paid invoices
      const paidInvoices = response.data.filter(
        doc => doc.status === 'paid' || doc.status === 'partially_paid'
      );
      setAvailableInvoices(paidInvoices);
      setFilteredInvoices(paidInvoices.slice(0, 10)); // Show recent 10 by default
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Filter invoices based on search query
  useEffect(() => {
    if (!invoiceSearch.trim()) {
      setFilteredInvoices(availableInvoices.slice(0, 10));
      return;
    }

    const query = invoiceSearch.toLowerCase();
    const filtered = availableInvoices.filter(inv =>
      inv.number.toLowerCase().includes(query) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(query))
    );
    setFilteredInvoices(filtered.slice(0, 10));
  }, [invoiceSearch, availableInvoices]);

  const selectInvoiceFromList = async (invoice) => {
    setInvoiceSearch(invoice.number);
    setShowInvoiceDropdown(false);
    await loadInvoiceDetails(invoice);
  };

  const loadInvoiceDetails = async (invoice) => {
    setSearchingInvoice(true);
    try {
      // Get returnable quantities
      const returnableResponse = await axios.get(`${API}/invoices/${invoice.id}/returnable`);
      const returnableInvoice = returnableResponse.data;

      if (!returnableInvoice.has_returnable_items) {
        toast.error("Cette facture n'a plus d'articles retournables");
        return;
      }

      setSelectedInvoice(returnableInvoice);
      setReturnLines(
        returnableInvoice.items
          .filter((item) => item.qty_returnable > 0)
          .map((item) => ({
            invoice_line_id: item.id,
            sku: item.sku,
            description: item.description,
            qty_invoiced: item.qty,
            qty_credited: item.qty_credited,
            qty_returnable: item.qty_returnable,
            qty_returned: 0,
            unit_price: item.unit_price,
            condition: "new",
            restocking_fee_excl_vat: 0,
            restock: true,
          }))
      );
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Erreur lors du chargement de la facture");
    } finally {
      setSearchingInvoice(false);
    }
  };

  const searchInvoice = async () => {
    if (!invoiceSearch.trim()) {
      toast.error("Veuillez saisir un numéro de facture");
      return;
    }

    setSearchingInvoice(true);
    try {
      // Search by invoice number
      const docsResponse = await axios.get(`${API}/documents?doc_type=invoice&limit=500`);
      const invoice = docsResponse.data.find(
        (doc) => doc.number.toLowerCase() === invoiceSearch.toLowerCase()
      );

      if (!invoice) {
        toast.error("Facture introuvable");
        return;
      }

      await loadInvoiceDetails(invoice);
    } catch (error) {
      console.error("Error searching invoice:", error);
      toast.error("Erreur lors de la recherche de la facture");
    } finally {
      setSearchingInvoice(false);
    }
  };

  const handleCreateReturn = async () => {
    const linesToReturn = returnLines.filter((line) => line.qty_returned > 0);

    if (linesToReturn.length === 0) {
      toast.error("Veuillez sélectionner au moins un article à retourner");
      return;
    }

    try {
      const response = await axios.post(`${API}/returns`, {
        invoice_id: selectedInvoice.id,
        reason: returnReason,
        warehouse_id: 1,
        lines: linesToReturn,
      });

      toast.success("Retour créé avec succès");
      setShowCreateDialog(false);
      resetForm();
      fetchReturns();
      navigate(`/returns/${response.data.id}`);
    } catch (error) {
      console.error("Error creating return:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la création du retour");
    }
  };

  const resetForm = () => {
    setInvoiceSearch("");
    setSelectedInvoice(null);
    setReturnLines([]);
    setReturnReason("");
    setShowInvoiceDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInvoiceDropdown && !event.target.closest('.invoice-search-container')) {
        setShowInvoiceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInvoiceDropdown]);

  const updateReturnLine = (index, field, value) => {
    const newLines = [...returnLines];
    newLines[index][field] = value;

    // Validate qty_returned
    if (field === "qty_returned") {
      const numValue = parseInt(value) || 0; // Use parseInt for whole numbers
      if (numValue > newLines[index].qty_returnable) {
        newLines[index].qty_returned = newLines[index].qty_returnable;
        toast.warning("Quantité ajustée au maximum retournable");
      } else if (numValue < 0) {
        newLines[index].qty_returned = 0;
      } else {
        newLines[index].qty_returned = numValue;
      }
    }

    setReturnLines(newLines);
  };

  const toggleAllRestock = (checked) => {
    setReturnLines(returnLines.map(line => ({
      ...line,
      restock: checked
    })));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-navy">Retours</h1>
            <p className="text-muted-foreground mt-1">Gérez les retours et notes de crédit</p>
          </div>
        </div>
        <Button
          className="bg-brand-orange hover:bg-brand-orange/90"
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau retour
        </Button>
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-orange border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      ) : returns.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun retour</h3>
          <p className="text-muted-foreground mb-4">Commencez par créer un nouveau retour</p>
          <Button onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un retour
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-medium text-sm">N° Retour</th>
                <th className="text-left p-4 font-medium text-sm">N° Facture</th>
                <th className="text-left p-4 font-medium text-sm">Client</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Articles</th>
                <th className="text-left p-4 font-medium text-sm">Statut</th>
                <th className="text-right p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => {
                const statusConfig = STATUS_CONFIG[ret.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={ret.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium">{ret.number}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{ret.invoice_number}</span>
                    </td>
                    <td className="p-4">{ret.customer_name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(ret.created_at).toLocaleDateString("fr-BE")}
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{ret.lines.length} article(s)</span>
                    </td>
                    <td className="p-4">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/returns/${ret.id}`)}
                      >
                        Voir détails
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-2xl">Créer un retour</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {!selectedInvoice ? (
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-base font-semibold">Rechercher une facture</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Numéro de facture ou nom de client
                  </p>

                  <div className="relative invoice-search-container">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="Ex: FAC-000001 ou nom du client"
                          value={invoiceSearch}
                          onChange={(e) => {
                            setInvoiceSearch(e.target.value);
                            setShowInvoiceDropdown(true);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
                          onFocus={() => setShowInvoiceDropdown(true)}
                          className="pl-11 h-12 text-base"
                        />
                      </div>
                      <Button
                        onClick={searchInvoice}
                        disabled={searchingInvoice}
                        className="h-12 px-6"
                      >
                        {searchingInvoice ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            Rechercher
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Dropdown with invoice suggestions */}
                    {showInvoiceDropdown && filteredInvoices.length > 0 && (
                      <Card className="absolute z-50 w-full mt-2 shadow-xl border-2 bg-white">
                        <div className="overflow-y-auto" style={{ maxHeight: '70vh', minHeight: '400px' }}>
                          <div className="p-1.5">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 bg-slate-50 sticky top-0 z-10 border-b">
                              {invoiceSearch ? `${filteredInvoices.length} Résultat(s)` : `Factures récentes (${filteredInvoices.length})`}
                            </div>
                            <div className="space-y-0.5 pt-1">
                              {filteredInvoices.map((invoice) => (
                                <button
                                  key={invoice.id}
                                  onClick={() => selectInvoiceFromList(invoice)}
                                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-3.5 h-3.5 text-brand-navy flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs font-bold text-brand-navy leading-tight">
                                          {invoice.number}
                                        </div>
                                        {invoice.customer_name && (
                                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
                                            <User className="w-2.5 h-2.5 flex-shrink-0" />
                                            <span className="truncate">{invoice.customer_name}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground leading-tight">
                                          {new Date(invoice.date).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                        <div className="text-xs font-bold text-brand-navy leading-tight">
                                          €{invoice.total?.toFixed(2) || '0.00'}
                                        </div>
                                      </div>
                                      <Badge
                                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0.5 leading-tight"
                                      >
                                        {invoice.status === 'paid' ? '✓' : '~'}
                                      </Badge>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {loadingInvoices && (
                    <div className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                      Chargement des factures...
                    </div>
                  )}

                  {!loadingInvoices && availableInvoices.length === 0 && (
                    <div className="text-sm text-amber-600 mt-3 p-3 bg-amber-50 rounded-lg">
                      Aucune facture payée disponible
                    </div>
                  )}

                  {!loadingInvoices && availableInvoices.length > 0 && !invoiceSearch && (
                    <div className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{availableInvoices.length} facture(s) payée(s) disponible(s)</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-2">
                {/* Back button */}
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setReturnLines([]);
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Changer de facture
                </Button>

                {/* Invoice Info */}
                <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-navy" />
                      <div>
                        <span className="text-muted-foreground text-xs block">Facture</span>
                        <span className="font-mono font-bold text-base text-brand-navy">{selectedInvoice.number}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-brand-navy" />
                      <div>
                        <span className="text-muted-foreground text-xs block">Client</span>
                        <span className="font-semibold text-base">{selectedInvoice.customer_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-navy" />
                      <div>
                        <span className="text-muted-foreground text-xs block">Date</span>
                        <span className="text-base">{new Date(selectedInvoice.date).toLocaleDateString('fr-BE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-muted-foreground text-xs block">Total</span>
                        <span className="font-bold text-lg text-brand-orange">€{selectedInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Return Reason */}
                <div>
                  <Label className="text-base font-semibold">Motif du retour</Label>
                  <Input
                    placeholder="Ex: Produit défectueux, erreur de commande..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="mt-2 h-11 text-base"
                  />
                </div>

                {/* Return Lines */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Articles à retourner</Label>
                  <div className="border-2 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-100 border-b-2">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold">Article</th>
                          <th className="text-center p-3 text-sm font-semibold w-20">Facturée</th>
                          <th className="text-center p-3 text-sm font-semibold w-20">Créditée</th>
                          <th className="text-center p-3 text-sm font-semibold w-24">Max retour</th>
                          <th className="text-center p-3 text-sm font-semibold w-28">Qté retour</th>
                          <th className="text-left p-3 text-sm font-semibold w-36">État</th>
                          <th className="text-center p-3 text-sm font-semibold w-24">
                            <div className="flex flex-col items-center gap-1">
                              <span>Restocher ?</span>
                              <input
                                type="checkbox"
                                checked={returnLines.length > 0 && returnLines.every(l => l.restock)}
                                onChange={(e) => toggleAllRestock(e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer"
                                title="Tout sélectionner / désélectionner"
                              />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnLines.map((line, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-semibold text-sm">{line.description}</div>
                              <div className="text-xs text-muted-foreground font-mono">{line.sku}</div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="font-mono text-xs">
                                {line.qty_invoiced}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="font-mono text-xs bg-slate-100">
                                {line.qty_credited}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="font-mono text-xs bg-green-50 border-green-200 text-green-700">
                                {line.qty_returnable}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={line.qty_returnable}
                                step="1"
                                value={line.qty_returned}
                                onChange={(e) =>
                                  updateReturnLine(idx, "qty_returned", e.target.value)
                                }
                                className="w-full text-center h-10 font-bold text-base"
                              />
                            </td>
                            <td className="p-3">
                              <Select
                                value={line.condition}
                                onValueChange={(value) => updateReturnLine(idx, "condition", value)}
                              >
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">Neuf</SelectItem>
                                  <SelectItem value="opened">Ouvert</SelectItem>
                                  <SelectItem value="damaged">Endommagé</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={line.restock}
                                onChange={(e) => updateReturnLine(idx, "restock", e.target.checked)}
                                className="w-5 h-5 rounded cursor-pointer"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t-2 px-6 py-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              className="h-12 px-8 text-base"
            >
              Annuler
            </Button>
            {selectedInvoice && (
              <Button
                className="bg-brand-orange hover:bg-brand-orange/90 h-12 px-8 text-base font-semibold"
                onClick={handleCreateReturn}
                disabled={returnLines.filter((l) => l.qty_returned > 0).length === 0}
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer le retour
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
