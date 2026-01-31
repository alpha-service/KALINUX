import { FileText, Receipt, FileCheck, FileX, Truck, CreditCard } from "lucide-react";

const DOC_TYPE_CONFIG = {
  quote: {
    title: "DEVIS / OFFERTE",
    icon: FileText,
    color: "text-black"
  },
  invoice: {
    title: "FACTURE / FACTUUR",
    icon: Receipt,
    color: "text-black"
  },
  receipt: {
    title: "TICKET DE CAISSE / KASSABON",
    icon: Receipt,
    color: "text-green-600"
  },
  credit_note: {
    title: "NOTE DE CRÉDIT / CREDITNOTA",
    icon: FileX,
    color: "text-red-600"
  },
  proforma: {
    title: "FACTURE PROFORMA / PROFORMA",
    icon: FileCheck,
    color: "text-purple-600"
  },
  delivery_note: {
    title: "BON DE LIVRAISON / LEVERINGSBON",
    icon: Truck,
    color: "text-amber-600"
  }
};

const STATUS_WATERMARKS = {
  draft: "BROUILLON / ONTWERP",
  unpaid: "IMPAYÉ / ONBETAALD",
  partially_paid: "PARTIELLEMENT PAYÉ / GEDEELTELIJK BETAALD"
};

export default function DocumentViewer({ document }) {
  const docConfig = DOC_TYPE_CONFIG[document.doc_type] || DOC_TYPE_CONFIG.invoice;
  const showWatermark = ["draft", "unpaid", "partially_paid"].includes(document.status);
  const watermarkText = STATUS_WATERMARKS[document.status];

  // Add print-specific class to ensure only this component prints
  const containerClass = "document-viewer printable-document";

  // Helper function to calculate line total with discounts
  const calculateLineTotal = (item) => {
    let lineTotal = item.qty * item.unit_price;

    // Apply item-level discount
    if (item.discount_type === 'percent' && item.discount_value > 0) {
      lineTotal -= lineTotal * (item.discount_value / 100);
    } else if (item.discount_type === 'fixed' && item.discount_value > 0) {
      lineTotal -= item.discount_value;
    }

    return lineTotal;
  };

  // Calculate totals from items
  const vatBreakdown = {};
  let totalHT = 0;
  let totalVAT = 0;

  document.items?.forEach(item => {
    const rate = item.vat_rate || 21;
    const lineTotalTTC = calculateLineTotal(item);
    const lineTotalHT = lineTotalTTC / (1 + rate / 100);
    const lineVAT = lineTotalTTC - lineTotalHT;

    if (!vatBreakdown[rate]) {
      vatBreakdown[rate] = { base: 0, vat: 0 };
    }
    vatBreakdown[rate].base += lineTotalHT;
    vatBreakdown[rate].vat += lineVAT;

    totalHT += lineTotalHT;
    totalVAT += lineVAT;
  });

  // Apply global discount to HT if present
  if (document.global_discount_type && document.global_discount_value > 0) {
    const discountOnHT = document.global_discount_type === 'percent'
      ? totalHT * (document.global_discount_value / 100)
      : document.global_discount_value / 1.21; // Convert TTC discount to HT

    totalHT -= discountOnHT;
    totalVAT = totalHT * 0.21; // Recalculate VAT on new HT

    // Update VAT breakdown proportionally
    Object.keys(vatBreakdown).forEach(rate => {
      const proportion = vatBreakdown[rate].base / (totalHT + discountOnHT);
      vatBreakdown[rate].base -= discountOnHT * proportion;
      vatBreakdown[rate].vat = vatBreakdown[rate].base * (parseFloat(rate) / 100);
    });
  }

  const calculatedTotal = totalHT + totalVAT;

  // Calculate due date (30 days from invoice date if not specified)
  const calculateDueDate = () => {
    if (document.due_date) {
      return new Date(document.due_date).toLocaleDateString('fr-BE');
    }
    const paymentTerms = document.payment_terms || 30;
    const invoiceDate = new Date(document.date || document.created_at);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate.toLocaleDateString('fr-BE');
  };

  return (
    <div className={`${containerClass} bg-slate-100 py-6`} style={{ fontFamily: 'Inter, sans-serif' }} data-testid="document-viewer">
      {/* A4 Container - Full height visible on screen, single page when printed */}
      <div className="relative bg-white shadow-lg mx-auto print:shadow-none print:m-0" style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        position: 'relative'
      }}>
        {/* Triangle Watermark Background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0.03, zIndex: 0 }}
        >
          <img
            src="https://customer-assets.emergentagent.com/job_laughing-kare/artifacts/ke0myhde_alpha-triangle-bg.png.png"
            alt=""
            style={{ width: '400px', height: '400px' }}
          />
        </div>

        {/* Status Watermark */}
        {showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1, opacity: 0.08 }}
          >
            <div
              className="font-bold text-red-600"
              style={{
                fontSize: '72px',
                transform: 'rotate(-45deg)',
                lineHeight: '1',
                whiteSpace: 'nowrap'
              }}
            >
              {watermarkText}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header: Logo + Opening Hours */}
          <div className="flex justify-between items-start mb-6">
            {/* Left: Logo + Brand */}
            <div>
              <img
                src="https://customer-assets.emergentagent.com/job_laughing-kare/artifacts/tf9bgx5t_alpha_rect_1000x500.png"
                alt="ALPHA&CO"
                style={{ height: '80px', marginBottom: '8px' }}
              />
            </div>

            {/* Right: Opening Hours / Store Info */}
            <div className="text-right text-xs text-black">
              <div className="font-semibold mb-1">Les heures d'ouverture / Openingsuren</div>
              <div>Lu-Ve / Ma-Vr: 08h00 - 17h30</div>
              <div>Sa / Za: 09h00 - 13h00</div>
              <div className="mt-2">
                <div>Tél: +32 2 449 81 22</div>
                <div>info@alphanco.be</div>
              </div>
            </div>
          </div>

          {/* Document Title + Number */}
          <div className="text-center mb-6">
            <h1
              className={`font-bold ${docConfig.color} mb-1`}
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '24px',
                letterSpacing: '0.5px'
              }}
            >
              {docConfig.title}
            </h1>
            <div className="text-sm text-black">
              <span className="font-semibold">{document.number}</span>
              {' • '}
              {new Date(document.date || document.created_at).toLocaleDateString('fr-BE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Seller vs Client Boxes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Vendeur / Verkoper */}
            <div className="border-2 border-black rounded p-4">
              <div className="text-xs font-bold text-black mb-2">VENDEUR / VERKOPER</div>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">ALPHA & CO Bouwmaterialen BRL</div>
                <div>Ninoofsesteenweg 77-79</div>
                <div>1700 Dilbeek</div>
                <div className="mt-2">
                  <div>TVA: BE 1028.386.674</div>
                  <div>Tél: +32 2 449 81 22</div>
                  <div>www.alphanco.be</div>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="border-2 border-black rounded p-4">
              <div className="text-xs font-bold text-black mb-2">CLIENT / KLANT</div>
              {document.customer_name ? (
                <div className="text-xs space-y-0.5 text-black">
                  <div className="font-semibold">{document.customer_name}</div>
                  {document.customer_address && (
                    <div>{document.customer_address}</div>
                  )}
                  {document.customer_vat && (
                    <div className="mt-2">TVA: {document.customer_vat}</div>
                  )}
                  {document.customer_reference && (
                    <div>Réf: {document.customer_reference}</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-black italic">Client comptoir</div>
              )}
            </div>
          </div>

          {/* Meta Row */}
          <div className="mb-6">
            <table className="w-full border border-black" style={{ fontSize: '11px' }}>
              <thead className="bg-slate-100">
                <tr>
                  <th className="border-r border-black p-2 text-left font-semibold">Date</th>
                  <th className="border-r border-black p-2 text-left font-semibold">N° de {document.doc_type === 'quote' ? 'devis' : 'facture'}</th>
                  <th className="border-r border-black p-2 text-left font-semibold">Référence</th>
                  <th className="p-2 text-left font-semibold">Date d'échéance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black p-2">
                    {new Date(document.date || document.created_at).toLocaleDateString('fr-BE')}
                  </td>
                  <td className="border-r border-slate-300 p-2 font-mono font-semibold">
                    {document.number}
                  </td>
                  <td className="border-r border-black p-2">
                    {document.customer_reference || '—'}
                  </td>
                  <td className="p-2">
                    {calculateDueDate()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-black" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-black p-2 text-left font-semibold">REF / ART</th>
                  <th className="border border-black p-2 text-left font-semibold">DESCRIPTION</th>
                  <th className="border border-black p-2 text-center font-semibold">QUANTITÉ</th>
                  {document.doc_type !== 'delivery_note' && (
                    <>
                      <th className="border border-black p-2 text-right font-semibold">PRIX UNIT.</th>
                      <th className="border border-black p-2 text-right font-semibold">REMISE</th>
                      <th className="border border-black p-2 text-center font-semibold">TVA %</th>
                      <th className="border border-black p-2 text-right font-semibold">TOTAL TTC</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {document.items?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-black p-2 font-mono text-xs">{item.sku}</td>
                    <td className="border border-black p-2">{item.name}</td>
                    <td className="border border-black p-2 text-center">{item.qty}</td>
                    {document.doc_type !== 'delivery_note' && (
                      <>
                        <td className="border border-black p-2 text-right font-mono">
                          €{Math.abs(item.unit_price).toFixed(2)}
                        </td>
                        <td className="border border-black p-2 text-right">
                          {item.discount_value > 0 ? (
                            item.discount_type === 'percent'
                              ? `${item.discount_value}%`
                              : `€${item.discount_value.toFixed(2)}`
                          ) : '—'}
                        </td>
                        <td className="border border-black p-2 text-center">{item.vat_rate}%</td>
                        <td className="border border-black p-2 text-right font-semibold font-mono">
                          €{calculateLineTotal(item).toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Area (Bottom Right) - Hidden for delivery notes */}
          {document.doc_type !== 'delivery_note' && (
            <div className="flex justify-end mb-8">
              <div style={{ width: '320px' }}>
                <table className="w-full border border-black" style={{ fontSize: '11px' }}>
                  <tbody>
                    <tr className="bg-slate-50">
                      <td className="border-r border-black p-2 font-semibold">Total HT / Totaal excl. BTW</td>
                      <td className="p-2 text-right font-mono">€{totalHT.toFixed(2)}</td>
                    </tr>
                    {Object.entries(vatBreakdown).map(([rate, amounts]) => (
                      <tr key={rate} className="bg-white">
                        <td className="border-r border-black p-2">TVA / BTW {rate}%</td>
                        <td className="p-2 text-right font-mono">€{amounts.vat.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-900 text-white">
                      <td className="border-r border-white p-3 font-bold text-sm">Total TTC / Totaal incl. BTW</td>
                      <td className="p-3 text-right font-mono font-bold text-lg">
                        €{(document.total || calculatedTotal).toFixed(2)}
                      </td>
                    </tr>
                    {document.paid_total > 0 && (
                      <>
                        <tr className="bg-green-50">
                          <td className="border-r border-black p-2 text-green-700">Payé / Betaald</td>
                          <td className="p-2 text-right font-mono text-green-700">
                            €{(document.paid_total || 0).toFixed(2)}
                          </td>
                        </tr>
                        {(document.total - document.paid_total) > 0.01 && (
                          <tr className="bg-amber-50">
                            <td className="border-r border-black p-2 font-semibold text-amber-700">
                              Reste à payer / Rest te betalen
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-amber-700">
                              €{((document.total || 0) - (document.paid_total || 0)).toFixed(2)}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment History */}
          {document.payments?.length > 0 && (
            <div className="mb-8 border-t border-black pt-4">
              <div className="text-xs font-semibold text-black mb-2">HISTORIQUE DES PAIEMENTS / BETALINGSGESCHIEDENIS</div>
              <div className="space-y-1">
                {document.payments.map((payment, idx) => {
                  // Handle missing date field
                  const paymentDate = payment.date || payment.created_at || document.date || document.created_at;
                  const dateStr = paymentDate ? new Date(paymentDate).toLocaleDateString('fr-BE') : '';

                  return (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-black" />
                        <span>
                          {dateStr && `${dateStr} - `}
                          {payment.method === 'cash' ? 'Espèces / Cash' : payment.method === 'card' ? 'Carte / Kaart' : 'Virement / Overschrijving'}
                        </span>
                      </div>
                      <span className="font-mono font-semibold">€{payment.amount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer: Payment Info + Legal */}
          <div className="border-t-2 border-black pt-4 mt-12">
            <div className="grid grid-cols-3 gap-4 text-xs mb-4">
              {/* KBC */}
              <div>
                <div className="font-bold text-black mb-1">KBC</div>
                <div className="text-black">
                  <div>IBAN: BE68 5390 0754 7034</div>
                  <div>BIC: KRED BE BB</div>
                </div>
              </div>

              {/* Belfius */}
              <div>
                <div className="font-bold text-black mb-1">Belfius</div>
                <div className="text-black">
                  <div>IBAN: BE68 5390 0754 7034</div>
                  <div>BIC: GKCC BE BB</div>
                </div>
              </div>

              {/* BNP Paribas Fortis */}
              <div>
                <div className="font-bold text-black mb-1">BNP Paribas Fortis</div>
                <div className="text-black">
                  <div>IBAN: BE68 5390 0754 7034</div>
                  <div>BIC: GEBABEBB</div>
                </div>
              </div>
            </div>

            {/* Legal Note */}
            <div className="text-center text-xs text-black pt-3 border-t border-black">
              <p>Les paiements par carte sont au taux négocié avec votre banque au jour de la transaction. Les chèques ne sont pas acceptés.</p>
              <p className="mt-2 font-semibold">ALPHA&CO BVBA - TVA BE 1028.386.674 - RPM Bruxelles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .document-viewer {
            margin: 0;
            padding: 0;
            background: white;
          }
          .document-viewer > div {
            box-shadow: none;
            margin: 0;
            padding: 10mm;
            max-height: none;
            overflow: visible;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
