/**
 * ThermalReceipt - 80mm Thermal Receipt Printer Format
 * Width: 80mm (302px at 96dpi, 72mm printable area)
 * Optimized for ESC/POS compatible thermal printers
 */
import { forwardRef } from 'react';

const ThermalReceipt = forwardRef(({ document }, ref) => {
  if (!document) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const items = document.items || [];
  const subtotal = items.reduce((sum, item) => {
    const q = item.qty || item.quantity || 0;
    const p = item.unit_price || 0;
    return sum + (p * q);
  }, 0);

  const discountTotal = items.reduce((sum, item) => {
    const q = item.qty || item.quantity || 0;
    const p = item.unit_price || 0;
    const lineTotal = p * q;

    if (item.discount_type === 'percent' || item.discount_percent) {
      const pct = item.discount_percent || item.discount_value || 0;
      return sum + (lineTotal * pct / 100);
    } else if (item.discount_type === 'fixed') {
      return sum + (item.discount_value || 0);
    }
    return sum;
  }, 0);

  const total = document.total !== undefined ? document.total : (subtotal - discountTotal);
  const vatTotal = document.vat_total !== undefined ? document.vat_total : (total * 0.21 / 1.21);
  const paid = document.paid_total || 0;
  const remaining = total - paid;

  return (
    <div
      ref={ref}
      className="thermal-receipt bg-white text-black font-mono"
      style={{
        width: '80mm',
        maxWidth: '80mm',
        padding: '4mm',
        fontSize: '11px',
        lineHeight: '1.3',
        fontFamily: "'Courier New', Courier, monospace"
      }}
    >
      {/* Header */}
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <div className="text-lg font-bold">ALPHA&CO</div>
        <div className="text-xs">BOUWMATERIALEN & DESIGN</div>
        <div className="text-xs mt-1">
          Ninoofsesteenweg 77-79<br />
          1700 Dilbeek, Belgique<br />
          Tél: +32 2 449 81 22<br />
          TVA: BE 1028.386.674
        </div>
      </div>

      {/* Document Info */}
      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span className="font-bold text-sm">
            {document.doc_type === 'receipt' ? 'TICKET DE CAISSE / KASSABON' :
              document.doc_type === 'invoice' ? 'FACTURE / FACTUUR' :
                document.doc_type === 'quote' ? 'DEVIS / OFFERTE' :
                  document.doc_type === 'credit_note' ? 'NOTE DE CRÉDIT / CREDITNOTA' :
                    document.doc_type === 'proforma' ? 'PROFORMA' :
                      document.doc_type === 'return' ? 'RETOUR / RETOUR' :
                        document.doc_type === 'delivery_note' ? 'BON LIVRAISON / LEVERINGSBON' : 'DOCUMENT'}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>N°: {document.number}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>{formatDate(document.date)}</span>
          <span>{formatTime(document.date)}</span>
        </div>
        {document.cashier && (
          <div className="text-xs">Caissier / Kassier: {document.cashier}</div>
        )}
      </div>

      {/* Customer Info (if present) */}
      {document.customer_name && (
        <div className="border-b border-dashed border-black pb-2 mb-2 text-xs">
          <div className="font-bold">Client / Klant:</div>
          <div>{document.customer_name}</div>
          {document.customer_vat && (
            <div>TVA / BTW: {document.customer_vat}</div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between font-bold text-xs border-b border-black pb-1 mb-1">
          <span>Article / Artikel</span>
          <span>Montant / Bedrag</span>
        </div>
        {items.map((item, idx) => {
          const q = item.qty || item.quantity || 0;
          const p = item.unit_price || 0;
          const discountVal = item.discount_value || 0;
          const isPercent = item.discount_type === 'percent' || item.discount_percent;

          let lineDiscount = 0;
          if (isPercent) {
            const pct = item.discount_percent || discountVal;
            lineDiscount = (q * p * pct / 100);
          } else if (item.discount_type === 'fixed') {
            lineDiscount = discountVal;
          }

          return (
            <div key={idx} className="mb-1">
              <div className="truncate text-xs font-medium">{item.name || item.description}</div>
              <div className="flex justify-between text-xs">
                <span>{q} x €{p.toFixed(2)}</span>
                <span>€{(q * p).toFixed(2)}</span>
              </div>
              {lineDiscount > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Remise {isPercent ? `-${item.discount_percent || discountVal}%` : ''}</span>
                  <span>-€{lineDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between text-xs">
          <span>Sous-total / Subtotaal:</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-xs text-green-700">
            <span>Remises / Kortingen:</span>
            <span>-€{discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span>TVA / BTW (21%):</span>
          <span>€{vatTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      {document.payments && document.payments.length > 0 && (
        <div className="border-b border-dashed border-black pb-2 mb-2 text-xs">
          <div className="font-bold mb-1">Paiements / Betalingen:</div>
          {document.payments.map((payment, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {payment.method === 'cash' ? 'Espèces / Contant' :
                  payment.method === 'card' ? 'Carte / Kaart' :
                    payment.method === 'bank_transfer' ? 'Virement / Overschr.' :
                      payment.method === 'credit' ? 'Crédit / Krediet' : payment.method}
              </span>
              <span>€{payment.amount.toFixed(2)}</span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="flex justify-between font-bold mt-1">
              <span>Reste / Rest:</span>
              <span>€{remaining.toFixed(2)}</span>
            </div>
          )}
          {remaining < 0 && (
            <div className="flex justify-between font-bold mt-1">
              <span>Rendu / Terug:</span>
              <span>€{Math.abs(remaining).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs">
        <div className="mb-2">
          --------------------------------
        </div>
        <div>Merci de votre visite!</div>
        <div>Bedankt voor uw bezoek!</div>
        <div className="mt-2 text-xs opacity-75">
          www.alphanco.be
        </div>
        <div className="mt-2">
          {/* Barcode placeholder */}
          <div className="font-mono text-xs tracking-wider">
            {document.number}
          </div>
        </div>
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
