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
  const documentViewerRef = useRef(null); // Add ref for DocumentViewer

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
    // Regular document print (PDF-like)
    window.print();
  };

  const handlePrintThermal = async () => {
    // Check if running in Electron with ESC/POS support
    const isElectron = window.electronAPI?.isElectron;

    if (isElectron) {
      // Use Electron API for direct printing
      try {
        console.log('🖨️ Printing via ESC/POS (Electron)');
        const result = await window.electronAPI.printer.printReceipt(document);

        if (result.success) {
          toast.success("Ticket imprimé avec succès");
        } else {
          toast.error(result.error || "Échec de l'impression");
        }
      } catch (error) {
        console.error('ESC/POS print error:', error);
        toast.error("Erreur d'impression: " + error.message);
      }
    } else {
      // Use backend API for browser-based printing
      try {
        console.log('🖨️ Printing via Backend API');
        const response = await axios.post(`${API}/print/thermal`, document);

        if (response.data.success) {
          toast.success("Ticket imprimé avec succès");
        } else {
          toast.error(response.data.error || "Échec de l'impression");
        }
      } catch (error) {
        console.error('Backend print error:', error);
        toast.error("Erreur d'impression: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const fallbackToBrowserPrint = () => {
    // Open thermal receipt in a new window for printing
    const printWindow = window.open('', '_blank', 'width=320,height=800');
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
            @media print {
              html, body {
                width: 80mm;
                background: white;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.4;
              width: 80mm;
              max-width: 80mm;
              padding: 2mm;
              background: #f0f0f0; /* Light gray for screen preview */
            }
            .receipt-container {
              background: white;
              width: 80mm;
              min-height: 100%;
              padding: 4mm;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              margin: 0 auto;
            }
            @media print {
              body { background: white; padding: 0; }
              .receipt-container { 
                box-shadow: none; 
                padding: 4mm;
                margin: 0;
                width: 100%;
              }
            }
            /* Copy styles from ThermalReceipt */
            .text-center { text-align: center; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-base { font-size: 14px; }
            .text-lg { font-size: 16px; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .border-b { border-bottom: 1px solid black; }
            .border-t { border-top: 1px solid black; }
            .border-dashed { border-style: dashed; }
            .border-black { border-color: black; }
            .pb-1 { padding-bottom: 4px; }
            .pb-2 { padding-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .pt-1 { padding-top: 4px; }
            .opacity-75 { opacity: 0.75; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-gray-600 { color: #4b5563; }
            .text-green-700 { color: #15803d; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptContent}
          </div>
          <script>
            window.onload = function() { 
              // Small delay to ensure styles are applied
              setTimeout(function() {
                window.print(); 
                window.onafterprint = function() { window.close(); }
              }, 250);
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

  const handleOpenPDFNewTab = () => {
    try {
      console.log('====== OPENING DOCUMENT IN NEW TAB ======');
      console.log('📝 Document:', document.number, '(', document.doc_type, ')');
      
      if (!document) {
        toast.error("⚠️ Document non chargé");
        return;
      }

      if (!documentViewerRef.current) {
        toast.error("❌ Document viewer non trouvé");
        return;
      }

      // Get the DocumentViewer HTML from ref
      const viewerHTML = documentViewerRef.current.innerHTML;
      
      // Create a new window
      const printWindow = window.open('', '_blank', 'width=900,height=1200');
      
      if (!printWindow) {
        toast.error("Veuillez autoriser les pop-ups");
        return;
      }

      // Write the complete HTML with styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${document.number} - ${document.doc_type}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden !important;
            }
            
            body {
              font-family: Inter, system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              padding: 20px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color: #000000 !important;
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body {
                background: white;
                padding: 0;
              }
              
              @page {
                size: A4;
                margin: 0;
              }
            }
            
            /* Import Tailwind-like utilities */
            .bg-white { background-color: white !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-black { background-color: #000000 !important; }
            .bg-blue-900 { background-color: #1e3a8a !important; }
            .bg-brand-navy { background-color: #1a365d !important; }
            .bg-brand-orange { background-color: #ff6b35 !important; }
            .bg-green-50 { background-color: #f0fdf4 !important; }
            /* Text colors - all black */
            * { color: #000000 !important; }
            .text-slate-600 { color: #000000 !important; }
            .text-slate-700 { color: #000000 !important; }
            .text-slate-800 { color: #000000 !important; }
            .text-black { color: #000000 !important; }
            .text-brand-navy { color: #000000 !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-green-600 { color: #16a34a !important; }
            .text-green-700 { color: #15803d !important; }
            .text-orange-600 { color: #ea580c !important; }
            .text-amber-700 { color: #b45309 !important; }
            .text-white { color: white !important; }
            
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .flex { display: flex; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            
            .border { border: 1px solid !important; }
            .border-2 { border-width: 2px !important; }
            .border-black { border-color: #000000 !important; }
            .border-slate-300 { border-color: #000000 !important; }
            .border-slate-200 { border-color: #000000 !important; }
            .border-b { border-bottom: 1px solid !important; }
            .border-t { border-top: 1px solid !important; }
            .border-t-2 { border-top-width: 2px !important; }
            .border-r { border-right: 1px solid !important; }
            
            .rounded { border-radius: 0.25rem; }
            .rounded-lg { border-radius: 0.5rem; }
            
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            
            .relative { position: relative; }
            .absolute { position: absolute; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            
            .pointer-events-none { pointer-events: none; }
            
            /* Print styles */
            @media print {
              .shadow-lg {
                box-shadow: none;
              }
              
              body {
                background: white !important;
                padding: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          ${viewerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Auto-trigger print dialog after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
      
      toast.success(`Document ouvert: ${document.number}`);
      console.log('✅ Document window opened successfully');
      
    } catch (error) {
      console.error("❌ Error opening document:", error);
      toast.error("Erreur lors de l'ouverture du document: " + error.message);
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
        <div className="flex-1" />
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
      <div ref={documentViewerRef}>
        <DocumentViewer document={document} />
      </div>

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
