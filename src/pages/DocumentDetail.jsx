import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Download,
  Copy,
  ArrowRight,
  CreditCard,
  ExternalLink,
  FileText,
  FileCheck,
  FileMinus,
  MoreVertical,
  Receipt,
  RotateCcw,
  Package,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DocumentViewer from "@/components/DocumentViewer";
import ThermalReceipt from "@/components/ThermalReceipt";
import { useLanguage } from "@/hooks/useLanguage";

const API = '/api';

const DOC_TYPE_LABELS = {
  quote: "Devis / Offerte",
  invoice: "Facture / Factuur",
  receipt: "Ticket / Kassabon",
  proforma: "Proforma",
  purchase_order: "Bon de commande",
  credit_note: "Note de crédit / Creditnota",
  delivery_note: "Bon de livraison / Leveringsbon",
};

const STATUS_CONFIG = {
  draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepté", color: "bg-green-100 text-green-700" },
  confirmed: { label: "Confirmé", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Livré", color: "bg-cyan-100 text-cyan-700" },
  unpaid: { label: "Impayé", color: "bg-red-100 text-red-700" },
  partially_paid: { label: "Partiellement payé", color: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", color: "bg-gray-100 text-gray-700" },
  credited: { label: "Crédité", color: "bg-purple-100 text-purple-700" },
};

export default function DocumentDetail() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const thermalReceiptRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const fetchDocument = async () => {
    try {
      const response = await axios.get(`${API}/documents/${docId}`);
      setDocument(response.data);
      setPaymentAmount((response.data.total - response.data.paid_total).toFixed(2));
    } catch (error) {
      toast.error("Document non trouvé");
      navigate("/documents");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }

    try {
      await axios.post(`${API}/documents/${docId}/pay`, {
        method: paymentMethod,
        amount: amount
      });
      toast.success("Paiement enregistré");
      setShowPaymentDialog(false);
      fetchDocument();
    } catch (error) {
      toast.error("Erreur lors du paiement");
    }
  };

  const handleConvert = async (targetType) => {
    try {
      const response = await axios.post(`${API}/documents/${docId}/convert?target_type=${targetType}`);
      const docTypeLabels = {
        purchase_order: 'bon de commande',
        delivery_note: 'bon de livraison',
        invoice: 'facture',
        credit_note: 'note de crédit'
      };
      toast.success(`Converti en ${docTypeLabels[targetType]}: ${response.data.number}`);
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error("Erreur lors de la conversion");
    }
  };

  const handleCreateReturn = () => {
    // Navigate to returns page with invoice pre-selected
    navigate(`/returns?invoice=${document.number}`);
  };

  const handleDuplicate = async () => {
    try {
      const response = await axios.post(`${API}/documents/${docId}/duplicate`);
      toast.success(`Document dupliqué: ${response.data.number}`);
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintThermal = () => {
    // Open thermal receipt in a new window for printing
    const printWindow = window.open('', '_blank', 'width=302,height=800');
    if (printWindow && thermalReceiptRef.current) {
      const receiptContent = thermalReceiptRef.current.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${document.number}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.3;
              width: 80mm;
              max-width: 80mm;
              padding: 4mm;
            }
            .text-center { text-align: center; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-lg { font-size: 14px; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .border-b { border-bottom: 1px dashed black; }
            .border-t { border-top: 1px dashed black; }
            .border-black { border-color: black; }
            .border-dashed { border-style: dashed; }
            .pb-1 { padding-bottom: 4px; }
            .pb-2 { padding-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .pt-1 { padding-top: 4px; }
            .opacity-75 { opacity: 0.75; }
            .tracking-wider { letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          ${receiptContent}
          <script>
            window.onload = function() { 
              window.print(); 
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Use frontend PDF generation
      const { generateDocumentPDF } = await import("@/utils/pdfGenerator");
      generateDocumentPDF(document);
      toast.success("PDF téléchargé");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Erreur lors du téléchargement du PDF");
    }
  };

  const handleOpenPDFNewTab = async () => {
    try {
      console.log('🔵 Opening PDF for document:', {
        id: document.id,
        number: document.number,
        type: document.doc_type,
        customer: document.customer_name
      });

      // Use frontend PDF generation and open in new tab
      const { generateDocumentPDF } = await import("@/utils/pdfGenerator");

      // Generate PDF
      const pdfDoc = generateDocumentPDF(document, false); // Don't auto-open yet
      const pdfBlob = pdfDoc.output('blob');

      // Create unique URL with cache-busting
      const timestamp = Date.now();
      const docId = document.id;
      const url = URL.createObjectURL(pdfBlob);

      console.log('✅ PDF generated:', {
        docId,
        docNumber: document.number,
        timestamp,
        blobSize: pdfBlob.size,
        windowName: `pdf_${docId}_${timestamp}`
      });

      // Open in new tab with unique name to prevent caching issues
      const windowName = `pdf_${docId}_${timestamp}`;
      const newWindow = window.open(url, windowName);

      // Clean up the blob URL after a delay
      if (newWindow) {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);
      } else {
        URL.revokeObjectURL(url);
        toast.error("Veuillez autoriser les pop-ups");
        return;
      }

      toast.success("PDF ouvert");
    } catch (error) {
      console.error("PDF open error:", error);
      toast.error("Erreur lors de l'ouverture du PDF");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!document) return null;

  const remaining = document.total - document.paid_total;
  const statusConfig = STATUS_CONFIG[document.status] || {};

  return (
    <div className="p-6" data-testid="document-detail">
      {/* Header Actions */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('return')}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-brand-navy">
              {document.number}
            </h1>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {DOC_TYPE_LABELS[document.doc_type]} • {new Date(document.created_at).toLocaleDateString("fr-BE")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t('print_a4')}
          </Button>
          {/* Thermal receipt print for tickets */}
          {(document.doc_type === "receipt" || document.doc_type === "invoice") && (
            <Button variant="outline" onClick={handlePrintThermal}>
              <Receipt className="w-4 h-4 mr-2" />
              {t('ticket_80mm')}
            </Button>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            {t('duplicate')}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleOpenPDFNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('open_pdf')}
          </Button>

          {/* Convert menu - Order-to-Cash flow */}
          {((document.doc_type === "quote" && ["draft", "sent"].includes(document.status)) ||
            (document.doc_type === "purchase_order" && document.status === "confirmed") ||
            (document.doc_type === "delivery_note" && document.status === "delivered")) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {t('convert')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('convert')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* From Quote (Devis) */}
                  {document.doc_type === "quote" && (
                    <>
                      <DropdownMenuItem onClick={() => handleConvert('purchase_order')}>
                        <Package className="w-4 h-4 mr-2" />
                        {t('doc_purchase_order')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConvert('delivery_note')}>
                        <Truck className="w-4 h-4 mr-2" />
                        {t('doc_delivery_note')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConvert('invoice')}>
                        <FileCheck className="w-4 h-4 mr-2" />
                        {t('doc_invoice')}
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* From Purchase Order (Bon de commande) */}
                  {document.doc_type === "purchase_order" && (
                    <>
                      <DropdownMenuItem onClick={() => handleConvert('delivery_note')}>
                        <Truck className="w-4 h-4 mr-2" />
                        {t('doc_delivery_note')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConvert('invoice')}>
                        <FileCheck className="w-4 h-4 mr-2" />
                        {t('doc_invoice')}
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* From Delivery Note (Bon de livraison) */}
                  {document.doc_type === "delivery_note" && (
                    <DropdownMenuItem onClick={() => handleConvert('invoice')}>
                      <FileCheck className="w-4 h-4 mr-2" />
                      {t('doc_invoice')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          {/* Create Return Button (for paid/partially_paid invoices) */}
          {document.doc_type === "invoice" && ["paid", "partially_paid", "unpaid"].includes(document.status) && (
            <Button
              variant="outline"
              onClick={handleCreateReturn}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('create_return')}
            </Button>
          )}

          {remaining > 0 && (
            <Button
              className="bg-brand-orange hover:bg-brand-orange/90"
              onClick={() => setShowPaymentDialog(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {t('pay')}
            </Button>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewer document={document} />

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Reste à payer: €{remaining.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Méthode</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces / Cash</SelectItem>
                  <SelectItem value="card">Carte / Kaart</SelectItem>
                  <SelectItem value="bank_transfer">Virement / Overschrijving</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Montant</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button
              className="bg-brand-orange hover:bg-brand-orange/90"
              onClick={handleAddPayment}
            >
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Thermal Receipt for printing */}
      <div className="hidden">
        <ThermalReceipt ref={thermalReceiptRef} document={document} />
      </div>
    </div>
  );
}
