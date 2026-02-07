import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, FileText, CreditCard, Banknote, Building2, Wallet, Trash } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

const API = '/api';

const STATUS_CONFIG = {
  draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
  validated: { label: "Validé", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

const SETTLEMENT_METHODS = [
  { value: "cash", label: "Remboursement espèces", icon: Banknote },
  { value: "card", label: "Remboursement carte", icon: CreditCard },
  { value: "bank", label: "Virement bancaire", icon: Building2 },
  { value: "customer_credit", label: "Crédit client", icon: Wallet },
];

export default function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState(null);
  const [creditNote, setCreditNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState("cash");

  useEffect(() => {
    fetchReturn();
  }, [id]);

  const fetchReturn = async () => {
    try {
      const response = await axios.get(`${API}/returns/${id}`);
      setReturnData(response.data);

      // If credit note exists, fetch it
      if (response.data.credit_note_id) {
        const cnResponse = await axios.get(`${API}/credit-notes/${response.data.credit_note_id}`);
        setCreditNote(cnResponse.data);
      }
    } catch (error) {
      console.error("Error fetching return:", error);
      toast.error("Retour introuvable");
      navigate("/returns");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReturn = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce brouillon de retour ?")) return;

    setProcessing(true);
    try {
      await axios.delete(`${API}/returns/${id}`);
      toast.success("Retour supprimé avec succès");
      navigate("/returns");
    } catch (error) {
      console.error("Error deleting return:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la suppression");
      setProcessing(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm("Confirmer la validation du retour ?")) return;

    setProcessing(true);
    try {
      await axios.put(`${API}/returns/${id}/validate`);
      toast.success("Retour validé avec succès");
      fetchReturn();
    } catch (error) {
      console.error("Error validating return:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la validation");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateCreditNote = async () => {
    if (!window.confirm("Générer une note de crédit pour ce retour ?")) return;

    setProcessing(true);
    try {
      const response = await axios.post(`${API}/returns/${id}/generate-credit-note`);
      setCreditNote(response.data);
      toast.success(`Note de crédit ${response.data.number} générée`, { duration: 2000 });
      setShowSettlementDialog(true);
      fetchReturn();
    } catch (error) {
      console.error("Error generating credit note:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la génération");
    } finally {
      setProcessing(false);
    }
  };

  const handleSettlement = async () => {
    setProcessing(true);
    try {
      await axios.post(`${API}/credit-notes/${creditNote.id}/settle`, {
        settlement_method: settlementMethod,
      });

      const methodLabel = SETTLEMENT_METHODS.find((m) => m.value === settlementMethod)?.label;
      toast.success(`Règlement effectué: ${methodLabel}`);
      setShowSettlementDialog(false);
      fetchReturn();
    } catch (error) {
      console.error("Error settling credit note:", error);
      toast.error(error.response?.data?.error || "Erreur lors du règlement");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPeppolUBL = async () => {
    try {
      const response = await axios.get(`${API}/credit-notes/${creditNote.id}/peppol-ubl`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${creditNote.number}_Peppol_UBL.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("UBL XML téléchargé");
    } catch (error) {
      console.error("Error downloading UBL:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!returnData) return null;

  const statusConfig = STATUS_CONFIG[returnData.status] || STATUS_CONFIG.draft;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-navy">
              Retour {returnData.number}
            </h1>
            <p className="text-muted-foreground mt-1">
              Facture: {returnData.invoice_number} • {returnData.customer_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>

          {returnData.status === "draft" && (
            <>
              <Button
                variant="destructive"
                className="mr-2"
                onClick={handleDeleteReturn}
                disabled={processing}
              >
                <Trash className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleValidate}
                disabled={processing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider le retour
              </Button>
            </>
          )}

          {returnData.status === "validated" && !returnData.credit_note_id && (
            <Button
              className="bg-brand-orange hover:bg-brand-orange/90"
              onClick={handleGenerateCreditNote}
              disabled={processing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer note de crédit
            </Button>
          )}
        </div>
      </div>

      {/* Return Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations du retour</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Date de création</span>
            <p className="font-medium">
              {new Date(returnData.created_at).toLocaleDateString("fr-BE")}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Facture d'origine</span>
            <p className="font-mono font-medium">{returnData.invoice_number}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Entrepôt</span>
            <p className="font-medium">Entrepôt #{returnData.warehouse_id}</p>
          </div>
          {returnData.reason && (
            <div className="col-span-3">
              <span className="text-sm text-muted-foreground">Motif</span>
              <p className="font-medium">{returnData.reason}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Return Lines */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Articles retournés</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-sm font-medium">SKU</th>
                <th className="text-left p-3 text-sm font-medium">Description</th>
                <th className="text-right p-3 text-sm font-medium">Qté</th>
                <th className="text-right p-3 text-sm font-medium">Prix unit. HT</th>
                <th className="text-left p-3 text-sm font-medium">État</th>
                <th className="text-center p-3 text-sm font-medium">Restock</th>
                <th className="text-right p-3 text-sm font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {returnData.lines.map((line, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="p-3 font-mono text-sm">{line.sku}</td>
                  <td className="p-3">{line.description}</td>
                  <td className="p-3 text-right">{line.qty_returned}</td>
                  <td className="p-3 text-right">€{line.unit_price_excl_vat.toFixed(2)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {line.condition}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    {line.restock ? (
                      <CheckCircle className="w-4 h-4 text-green-600 inline" />
                    ) : (
                      <span className="text-muted-foreground">Non</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    €{(line.qty_returned * line.unit_price_excl_vat).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Credit Note Info */}
      {creditNote && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Note de crédit</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPeppolUBL}>
                <FileText className="w-4 h-4 mr-2" />
                Export Peppol UBL
              </Button>
              {creditNote.settlement_status === "pending" && (
                <Button
                  className="bg-brand-orange hover:bg-brand-orange/90"
                  onClick={() => setShowSettlementDialog(true)}
                >
                  Régler le crédit
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Numéro</span>
              <p className="font-mono font-semibold">{creditNote.number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Date d'émission</span>
              <p className="font-medium">
                {new Date(creditNote.issue_date).toLocaleDateString("fr-BE")}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Statut règlement</span>
              <Badge
                className={
                  creditNote.settlement_status === "settled"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }
              >
                {creditNote.settlement_status === "settled" ? "Réglé" : "En attente"}
              </Badge>
            </div>
          </div>

          {/* Credit Note Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span className="font-mono">€{creditNote.total_excl_vat.toFixed(2)}</span>
                </div>
                {creditNote.vat_breakdown.map((vat, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                    <span>TVA {vat.rate}%:</span>
                    <span className="font-mono">€{vat.vat.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total TTC:</span>
                  <span className="font-mono">€{creditNote.total_incl_vat.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {creditNote.settlement_method && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm">
                <strong>Méthode de règlement:</strong>{" "}
                {SETTLEMENT_METHODS.find((m) => m.value === creditNote.settlement_method)?.label}
              </p>
              {creditNote.settled_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  Réglé le {new Date(creditNote.settled_at).toLocaleString("fr-BE")}
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Settlement Dialog */}
      <Dialog open={showSettlementDialog} onOpenChange={setShowSettlementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Règlement du crédit</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant à régler:</span>
                <span className="text-2xl font-bold text-brand-navy">
                  €{creditNote?.total_incl_vat.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Méthode de règlement</Label>
              <RadioGroup value={settlementMethod} onValueChange={setSettlementMethod}>
                {SETTLEMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.value}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSettlementMethod(method.value)}
                    >
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Icon className="w-5 h-5 text-slate-600" />
                      <Label htmlFor={method.value} className="flex-1 cursor-pointer">
                        {method.label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {settlementMethod === "customer_credit" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Le montant sera ajouté au solde crédit du client et pourra être utilisé pour de
                  futurs achats.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettlementDialog(false)}>
              Annuler
            </Button>
            <Button
              className="bg-brand-orange hover:bg-brand-orange/90"
              onClick={handleSettlement}
              disabled={processing}
            >
              Confirmer le règlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
