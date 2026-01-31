import jsPDF from "jspdf";

// Company info
const COMPANY = {
  name: "ALPHA&CO",
  subtitle: "BOUWMATERIALEN & DESIGN",
  address: "Ninoofsesteenweg 77-79",
  city: "1700 Dilbeek, Belgique",
  vat: "BE 1028.386.674",
  phone: "+32 2 449 81 22",
  email: "info@alphanco.be",
  hours: "Lu-Ve 08:00-17:30, Sa 09:00-13:00"
};

export const generateReceiptPDF = (sale, customer = null) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Colors
  const navyBlue = [26, 54, 93];
  const orange = [255, 107, 53];
  const gray = [100, 116, 139];

  // Header background
  doc.setFillColor(...navyBlue);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, y + 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.subtitle, margin, y + 20);

  // Company info right side
  doc.setFontSize(8);
  doc.text([
    COMPANY.address,
    COMPANY.city,
    `TVA: ${COMPANY.vat}`,
    COMPANY.phone
  ], pageWidth - margin, y + 8, { align: "right" });

  y = 55;

  // Document type and number
  doc.setTextColor(...navyBlue);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const docType = sale.status === "paid" ? "FACTURE / FACTUUR" : "TICKET DE CAISSE / KASSABON";
  doc.text(docType, margin, y);

  doc.setFontSize(12);
  doc.setTextColor(...gray);
  doc.text(`N° ${sale.number}`, margin, y + 8);

  // Date
  const saleDate = new Date(sale.created_at || sale.date || Date.now());
  const dateStr = saleDate.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  doc.text(dateStr, pageWidth - margin, y + 8, { align: "right" });

  y += 20;

  // Customer info if available
  if (customer || sale.customer_name) {
    doc.setFillColor(247, 250, 252);
    doc.rect(margin, y, pageWidth - margin * 2, 20, "F");

    doc.setTextColor(...navyBlue);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Client / Klant:", margin + 5, y + 8);

    doc.setFont("helvetica", "normal");
    const customerName = customer?.name || sale.customer_name || "Client comptoir";
    doc.text(customerName, margin + 5, y + 14);

    y += 25;
  }

  y += 5;

  // Table Header
  doc.setFillColor(...navyBlue);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  doc.text("SKU", margin + 3, y + 5.5);
  doc.text("Description", margin + 35, y + 5.5);
  doc.text("Qté", margin + 100, y + 5.5);
  doc.text("Prix", margin + 120, y + 5.5);
  doc.text("Total", pageWidth - margin - 3, y + 5.5, { align: "right" });

  y += 10;

  // Table rows
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");

  sale.items.forEach((item, idx) => {
    // Alternate row color
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, pageWidth - margin * 2, 8, "F");
    }

    let lineSubtotal = item.qty * item.unit_price;
    if (item.discount_type === "percent") {
      lineSubtotal -= lineSubtotal * (item.discount_value / 100);
    } else if (item.discount_type === "fixed") {
      lineSubtotal -= item.discount_value;
    }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.text(item.sku.substring(0, 15), margin + 3, y + 4);
    doc.text(item.name.substring(0, 30), margin + 35, y + 4);
    doc.text(item.qty.toString(), margin + 100, y + 4);
    doc.text(`€${item.unit_price.toFixed(2)}`, margin + 120, y + 4);
    doc.text(`€${lineSubtotal.toFixed(2)}`, pageWidth - margin - 3, y + 4, { align: "right" });

    y += 8;
  });

  y += 10;

  // Totals section
  const totalsX = pageWidth - margin - 70;
  const totalsWidth = 70;

  doc.setFillColor(247, 250, 252);
  doc.rect(totalsX, y, totalsWidth, 35, "F");

  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Calculate subtotal and VAT from items if not provided
  let calculatedSubtotal = 0;
  sale.items.forEach(item => {
    let lineSubtotal = item.qty * item.unit_price;
    if (item.discount_type === "percent") {
      lineSubtotal -= lineSubtotal * (item.discount_value / 100);
    } else if (item.discount_type === "fixed") {
      lineSubtotal -= item.discount_value;
    }
    calculatedSubtotal += lineSubtotal;
  });

  // Apply global discount
  if (sale.global_discount_type === "percent" && sale.global_discount_value > 0) {
    calculatedSubtotal -= calculatedSubtotal * (sale.global_discount_value / 100);
  } else if (sale.global_discount_type === "fixed" && sale.global_discount_value > 0) {
    calculatedSubtotal -= sale.global_discount_value;
  }

  const calculatedVAT = calculatedSubtotal * 0.21;
  const calculatedTotal = calculatedSubtotal + calculatedVAT;

  const subtotal = sale.subtotal !== undefined ? sale.subtotal : calculatedSubtotal;
  const vatTotal = sale.vat_total !== undefined ? sale.vat_total : calculatedVAT;
  const total = sale.total !== undefined ? sale.total : calculatedTotal;

  // Global discount if any
  let yOffset = 0;
  if (sale.global_discount_value > 0) {
    doc.text("Remise globale:", totalsX + 5, y + 7);
    doc.text(
      sale.global_discount_type === "percent"
        ? `-${sale.global_discount_value}%`
        : `-€${sale.global_discount_value.toFixed(2)}`,
      totalsX + totalsWidth - 5,
      y + 7,
      { align: "right" }
    );
    yOffset = 5;
  }

  doc.text("Sous-total HT:", totalsX + 5, y + 7 + yOffset);
  doc.text(`€${subtotal.toFixed(2)}`, totalsX + totalsWidth - 5, y + 7 + yOffset, { align: "right" });

  doc.text("TVA (21%):", totalsX + 5, y + 14 + yOffset);
  doc.text(`€${vatTotal.toFixed(2)}`, totalsX + totalsWidth - 5, y + 14 + yOffset, { align: "right" });

  // Total
  doc.setFillColor(...orange);
  doc.rect(totalsX, y + 20 + yOffset, totalsWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC:", totalsX + 5, y + 28 + yOffset);
  doc.text(`€${total.toFixed(2)}`, totalsX + totalsWidth - 5, y + 28 + yOffset, { align: "right" });

  y += 45 + yOffset;

  // Payment info
  if (sale.payments && sale.payments.length > 0) {
    doc.setTextColor(...navyBlue);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Paiement / Betaling:", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);

    sale.payments.forEach((payment, idx) => {
      const methodLabel = {
        cash: "Espèces / Cash",
        card: "Carte / Kaart",
        bank_transfer: "Virement / Overschrijving"
      }[payment.method] || payment.method;

      doc.text(`${methodLabel}: €${payment.amount.toFixed(2)}`, margin, y + 7 + (idx * 5));
    });
  }

  // Status watermark for unpaid
  if (sale.status === "unpaid" || sale.status === "partially_paid") {
    doc.setTextColor(255, 100, 100);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    doc.text("IMPAYÉ", pageWidth / 2, 150, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(...navyBlue);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${COMPANY.name} - ${COMPANY.address}, ${COMPANY.city} - TVA: ${COMPANY.vat}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    `${COMPANY.email} - ${COMPANY.phone} - ${COMPANY.hours}`,
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`${sale.number}-receipt.pdf`);

  return doc;
};

export const generateInvoicePDF = (sale, customer) => {
  return generateReceiptPDF(sale, customer);
};

// Generate PDF for any document type
export const generateDocumentPDF = (document, openInNewTab = false) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true
  });

  // Set duplex printing for Invoice and Quote (page 2 should print on back)
  if (document.doc_type === 'invoice' || document.doc_type === 'quote') {
    // This sets the PDF viewer hint for duplex (two-sided) printing
    doc.viewerPreferences({
      'Duplex': 'DuplexFlipLongEdge' // Long-edge binding (flip on long side)
    });
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Colors
  const navyBlue = [26, 54, 93];
  const orange = [255, 107, 53];
  const gray = [100, 116, 139];
  const lightGray = [248, 250, 252];

  // Header - Simple text version matching DocumentViewer
  doc.setTextColor(...navyBlue);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ALPHA&CO", margin, y + 8);

  // Right: Opening hours
  doc.setTextColor(...gray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Les heures d'ouverture / Openingsuren", pageWidth - margin, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Lu-Ve / Ma-Vr: 08h00 - 17h30", pageWidth - margin, y + 10, { align: "right" });
  doc.text("Sa / Za: 09h00 - 13h00", pageWidth - margin, y + 14, { align: "right" });
  doc.text("Tél: +32 2 449 81 22", pageWidth - margin, y + 22, { align: "right" });
  doc.text("info@alphanco.be", pageWidth - margin, y + 26, { align: "right" });

  y = 35;

  // Document Title centered
  const docTypeLabels = {
    quote: "DEVIS / OFFERTE",
    purchase_order: "BON DE COMMANDE / BESTELBON",
    invoice: "FACTURE / FACTUUR",
    receipt: "TICKET / KASSABON",
    proforma: "PROFORMA",
    credit_note: "NOTE DE CRÉDIT / CREDITNOTA",
    delivery_note: "BON DE LIVRAISON / LEVERINGSBON"
  };

  const docTypeLabel = docTypeLabels[document.doc_type] || "DOCUMENT";

  doc.setTextColor(...navyBlue);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(docTypeLabel, pageWidth / 2, y, { align: "center" });

  y += 6;

  // Document number and date centered
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(document.date || document.created_at).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  doc.text(`${document.number} • ${dateStr}`, pageWidth / 2, y, { align: "center" });

  y += 12;

  // Two column boxes: Vendeur / Client
  const boxWidth = (pageWidth - 2 * margin - 10) / 2;
  const boxHeight = 35;

  // Vendeur box
  doc.setDrawColor(...navyBlue);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, boxWidth, boxHeight);

  doc.setTextColor(...navyBlue);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("VENDEUR / VERKOPER", margin + 5, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text("ALPHA & CO Bouwmaterialen BRL", margin + 5, y + 12);
  doc.text("Ninoofsesteenweg 77-79", margin + 5, y + 16);
  doc.text("1700 Dilbeek", margin + 5, y + 20);
  doc.text("TVA: BE 1028.386.674", margin + 5, y + 26);
  doc.text("www.alphanco.be", margin + 5, y + 30);

  // Client box
  const clientX = margin + boxWidth + 10;
  doc.setDrawColor(...navyBlue);
  doc.rect(clientX, y, boxWidth, boxHeight);

  doc.setTextColor(...navyBlue);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT / KLANT", clientX + 5, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  if (document.customer_name) {
    doc.text(document.customer_name, clientX + 5, y + 12);
    if (document.customer_address) {
      doc.text(document.customer_address.substring(0, 40), clientX + 5, y + 16);
    }
    if (document.customer_vat) {
      doc.text(`TVA: ${document.customer_vat}`, clientX + 5, y + 22);
    }
  } else {
    doc.text("Client comptoir", clientX + 5, y + 12);
  }

  y += boxHeight + 8;

  // Meta Row Table (Date, N° facture, Référence, Date d'échéance)
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - 2 * margin, 12); // Outer border

  const colWidth = (pageWidth - 2 * margin) / 4;

  // Headers
  doc.setTextColor(...gray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Date", margin + 2, y + 4);
  doc.text(`N° de ${document.doc_type === 'quote' ? 'devis' : 'facture'}`, margin + colWidth + 2, y + 4);
  doc.text("Référence", margin + colWidth * 2 + 2, y + 4);
  doc.text("Date d'échéance", margin + colWidth * 3 + 2, y + 4);

  // Vertical lines
  doc.line(margin + colWidth, y, margin + colWidth, y + 12);
  doc.line(margin + colWidth * 2, y, margin + colWidth * 2, y + 12);
  doc.line(margin + colWidth * 3, y, margin + colWidth * 3, y + 12);

  // Horizontal line between header and data
  doc.line(margin, y + 6, pageWidth - margin, y + 6);

  // Data row
  doc.setFont("helvetica", "normal");
  doc.text(new Date(document.date || document.created_at).toLocaleDateString('fr-BE'), margin + 2, y + 10);
  doc.setFont("helvetica", "bold");
  doc.text(document.number, margin + colWidth + 2, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(document.customer_reference || '—', margin + colWidth * 2 + 2, y + 10);

  // Calculate due date
  let dueDateStr = '—';
  if (document.due_date) {
    dueDateStr = new Date(document.due_date).toLocaleDateString('fr-BE');
  } else if (document.doc_type === 'invoice') {
    const paymentTerms = document.payment_terms || 30;
    const invoiceDate = new Date(document.date || document.created_at);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    dueDateStr = dueDate.toLocaleDateString('fr-BE');
  }
  doc.text(dueDateStr, margin + colWidth * 3 + 2, y + 10);

  y += 18;

  // Items table header - Bilingual
  doc.setFillColor(...navyBlue);
  doc.rect(margin, y, pageWidth - 2 * margin, 13, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  // Column: REF/ART - DESCRIPTION
  doc.text("REF / ART", margin + 3, y + 5);
  doc.text("DESCRIPTION", margin + 3, y + 9);

  // Column: QUANTITÉ / HOEVEELHEID
  doc.text("QUANTITÉ", pageWidth - 85, y + 5);
  doc.text("HOEVEEL", pageWidth - 85, y + 9);

  // Column: PRIX UNIT. / EENHEIDS
  doc.text("PRIX UNIT.", pageWidth - 65, y + 5);
  doc.text("PRIJS", pageWidth - 65, y + 9);

  // Column: REMISE / KORTING
  doc.text("REMISE", pageWidth - 45, y + 5);
  doc.text("KORTING", pageWidth - 45, y + 9);

  // Column: TVA / BTW
  doc.text("TVA %", pageWidth - 27, y + 5);
  doc.text("BTW %", pageWidth - 27, y + 9);

  // Column: TOTAL TTC / TOTAAL INCL
  doc.text("TOTAL TTC", pageWidth - margin - 3, y + 5, { align: "right" });
  doc.text("TOTAAL", pageWidth - margin - 3, y + 9, { align: "right" });

  y += 15;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);

  let subtotal = 0;

  document.items.forEach((item, idx) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const itemTotal = item.qty * item.unit_price;
    let lineTotal = itemTotal;

    // Apply item discount
    if (item.discount_type === 'percent') {
      lineTotal -= lineTotal * (item.discount_value / 100);
    } else if (item.discount_type === 'fixed') {
      lineTotal -= item.discount_value;
    }

    subtotal += lineTotal;

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, "F");
    }

    // REF/ART - SKU or EAN
    const refText = item.sku || item.ean || '—';
    doc.text(refText, margin + 3, y + 2);

    // DESCRIPTION
    doc.text(item.name || item.description, margin + 18, y + 2);

    // QUANTITÉ
    doc.text(item.qty.toString(), pageWidth - 85, y + 2);

    // PRIX UNIT.
    doc.text(`€${item.unit_price.toFixed(2)}`, pageWidth - 65, y + 2);

    // REMISE
    const discountText = item.discount_type === 'percent'
      ? `${item.discount_value}%`
      : (item.discount_type === 'fixed' ? `€${item.discount_value.toFixed(2)}` : '—');
    doc.text(discountText, pageWidth - 45, y + 2);

    // TVA %
    const vatRate = item.vat_rate || 21;
    doc.text(`${vatRate}%`, pageWidth - 27, y + 2);

    // TOTAL TTC
    doc.text(`€${lineTotal.toFixed(2)}`, pageWidth - margin - 3, y + 2, { align: "right" });

    y += 8;
  });

  // Global discount
  if (document.global_discount_type && document.global_discount_value > 0) {
    if (document.global_discount_type === 'percent') {
      subtotal -= subtotal * (document.global_discount_value / 100);
    } else if (document.global_discount_type === 'fixed') {
      subtotal -= document.global_discount_value;
    }
  }

  const vatTotal = subtotal * 0.21;
  const total = subtotal + vatTotal;

  y += 5;

  // Totals box
  const totalsX = pageWidth - margin - 65;
  const totalsWidth = 65;
  const yOffset = document.global_discount_type ? 6 : 0;

  doc.setDrawColor(...navyBlue);
  doc.setLineWidth(0.5);
  doc.rect(totalsX, y, totalsWidth, 32 + yOffset);

  doc.setTextColor(...navyBlue);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Subtotal HT (FR) / Subtotaal Excl. BTW (NL)
  doc.setFontSize(8);
  doc.text("Sous-total HT / Subtotaal excl. BTW:", totalsX + 5, y + 8);
  doc.text(`€${subtotal.toFixed(2)}`, totalsX + totalsWidth - 5, y + 8, { align: "right" });

  // Global discount
  if (document.global_discount_type && document.global_discount_value > 0) {
    const discountLabel = document.global_discount_type === 'percent'
      ? `Remise / Korting (${document.global_discount_value}%):`
      : 'Remise / Korting:';
    const discountAmount = document.global_discount_type === 'percent'
      ? (subtotal / (1 - document.global_discount_value / 100)) * (document.global_discount_value / 100)
      : document.global_discount_value;

    doc.text(discountLabel, totalsX + 5, y + 14);
    doc.text(`-€${discountAmount.toFixed(2)}`, totalsX + totalsWidth - 5, y + 14, { align: "right" });
  }

  // VAT / BTW
  doc.text("TVA / BTW (21%):", totalsX + 5, y + 14 + yOffset);
  doc.text(`€${vatTotal.toFixed(2)}`, totalsX + totalsWidth - 5, y + 14 + yOffset, { align: "right" });

  // Total TTC (FR) / Totaal incl. BTW (NL)
  doc.setFillColor(...orange);
  doc.rect(totalsX, y + 20 + yOffset, totalsWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC / TOTAAL:", totalsX + 5, y + 28 + yOffset);
  doc.text(`€${total.toFixed(2)}`, totalsX + totalsWidth - 5, y + 28 + yOffset, { align: "right" });

  y += 45 + yOffset;

  // Payment info
  if (document.payments && document.payments.length > 0) {
    doc.setTextColor(...navyBlue);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Paiement / Betaling:", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);

    document.payments.forEach((payment, idx) => {
      const methodLabel = {
        cash: "Espèces / Cash",
        card: "Carte / Kaart",
        bank_transfer: "Virement / Overschrijving"
      }[payment.method] || payment.method;

      doc.text(`${methodLabel}: €${payment.amount.toFixed(2)}`, margin, y + 7 + (idx * 5));
    });
  }

  // Status watermark
  if (document.status === "unpaid" || document.status === "partially_paid") {
    doc.setTextColor(255, 100, 100);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    doc.text("IMPAYÉ", pageWidth / 2, 150, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  } else if (document.status === "paid") {
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.text("PAYÉ", pageWidth / 2, 150, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  } else if (document.status === "draft") {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.text("BROUILLON", pageWidth / 2, 150, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  }

  // Footer - Page 1 with payment terms
  const footerY = doc.internal.pageSize.getHeight() - 35;
  doc.setDrawColor(...navyBlue);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...gray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  // Payment terms for Invoice
  if (document.doc_type === 'invoice') {
    doc.text(
      "Paiement à 30 jours à compter de la date de facture, sauf accord écrit contraire.",
      pageWidth / 2,
      footerY,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.text(
      "Betaling binnen 30 dagen na factuurdatum, tenzij schriftelijk anders overeengekomen.",
      pageWidth / 2,
      footerY + 3,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.text(
      "En cas de retard de paiement (B2B), des intérêts et une indemité forfaitaire peuvent être dus.",
      pageWidth / 2,
      footerY + 6,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.text(
      "Bij laattijdige betaling (B2B) kunnen nalatigheidsinteresten en een forfaitaire vergoeding verschuldigd zijn.",
      pageWidth / 2,
      footerY + 9,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.setFontSize(6.5);
    doc.text(
      "Conditions générales : voir page 2 (CGV) / https://alphanco.be/cgv | Algemene voorwaarden: zie pagina 2 (AV) / https://alphanco.be/av",
      pageWidth / 2,
      footerY + 13,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
  }

  // Quote validity
  if (document.doc_type === 'quote') {
    doc.text(
      "Devis valable 14 jours, sauf indication contraire. La commande est confirmée après acceptation écrite (signature 'Bon pour accord').",
      pageWidth / 2,
      footerY,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.text(
      "Offerte geldig gedurende 14 dagen, tenzij anders vermeld. De bestelling is bevestigd na schriftelijke aanvaarding (ondertekening 'Voor akkoord').",
      pageWidth / 2,
      footerY + 4,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    doc.setFontSize(6.5);
    doc.text(
      "Conditions générales : voir page 2 / https://alphanco.be/cgv | Algemene voorwaarden: zie pagina 2 / https://alphanco.be/av",
      pageWidth / 2,
      footerY + 9,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
  }

  // Company info line at bottom
  doc.setFontSize(7);
  doc.text(
    `${COMPANY.name} - ${COMPANY.address}, ${COMPANY.city} - TVA: ${COMPANY.vat}`,
    pageWidth / 2,
    footerY + 17,
    { align: "center" }
  );
  doc.text(
    `${COMPANY.email} - ${COMPANY.phone}`,
    pageWidth / 2,
    footerY + 20,
    { align: "center" }
  );

  // Add Page 2 with Terms & Conditions (CGV/AV) for Invoice and Quote
  // This page will print on the BACK SIDE (verso) when duplex printing is enabled
  if (document.doc_type === 'invoice' || document.doc_type === 'quote') {
    doc.addPage();
    let y2 = margin;

    // Add note at top for manual duplex
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Page 2 / Pagina 2 - À imprimer au verso / Aan achterzijde te drukken", pageWidth / 2, y2, { align: "center" });
    y2 += 5;

    // French Terms - CGV
    doc.setTextColor(...navyBlue);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONDITIONS GÉNÉRALES DE VENTE (CGV)", pageWidth / 2, y2, { align: "center" });
    y2 += 10;

    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const cgvText = [
      "Champ d'application : Les présentes CGV s'appliquent à toutes nos offres, devis, commandes et factures.",
      "",
      "Prix : Prix en EUR, TVA selon le taux applicable ; transport/pose non inclus sauf mention contraire.",
      "",
      "Paiement : Paiement par virement sur l'IBAN indiqué ; échéance indiquée sur la facture (ou conditions de paiement).",
      "",
      "Retard de paiement (B2B) : En cas de retard, intérêts et indemité forfaitaire selon les règles européennes/BE sur les retards de paiement.",
      "",
      "Réserve de propriété : Les marchandises restent notre propriété jusqu'à paiement intégral.",
      "",
      "Livraison / enlèvement : Délais indicatifs ; les risques sont transférés à la livraison ou à l'enlèvement.",
      "",
      "Réclamations : Toute réclamation doit être communiquée par écrit dans un délai raisonnable après réception.",
      "",
      "Retours / avoirs : Retours uniquement après accord ; si un retour est accepté, une note de crédit est émise (pas de correction 'informelle').",
      "",
      "Garantie : Selon la garantie légale et/ou fabricant ; exclusions : mauvaise utilisation, usure normale."
    ];

    cgvText.forEach(line => {
      if (y2 > 270) {
        doc.addPage();
        y2 = margin;
      }
      doc.text(line, margin, y2, { maxWidth: pageWidth - 2 * margin });
      y2 += line === "" ? 2 : 4;
    });

    y2 += 5;

    // Dutch Terms - AV
    doc.setTextColor(...navyBlue);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ALGEMENE VOORWAARDEN (AV)", pageWidth / 2, y2, { align: "center" });
    y2 += 10;

    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const avText = [
      "Toepassing: Deze AV gelden voor al onze offertes, bestellingen en facturen.",
      "",
      "Prijzen: Prijzen in EUR, btw volgens toepasselijk tarief; transport/plaatsing niet inbegrepen tenzij anders vermeld.",
      "",
      "Betaling: Betaling via overschrijving op de vermelde IBAN; vervaldag vermeld op de factuur (of betalingstermijnen).",
      "",
      "Laattijdige betaling (B2B): Bij laattijdige betaling kunnen interesten en een forfaitaire vergoeding verschuldigd zijn volgens de regels inzake betalingsachterstand.",
      "",
      "Eigendomsvoorbehoud: Goederen blijven onze eigendom tot volledige betaling.",
      "",
      "Levering / afhaling: Termijnen indicatief; risico gaat over bij levering/afhaling.",
      "",
      "Klachten: Schriftelijk melden binnen een redelijke termijn na ontvangst.",
      "",
      "Retour / creditnota: Retour enkel na akkoord; bij aanvaarde retour wordt een creditnota opgesteld.",
      "",
      "Garantie: Wettelijke en/of fabrieksgarantie; uitsluitingen: verkeerd gebruik, normale slijtage."
    ];

    avText.forEach(line => {
      if (y2 > 270) {
        doc.addPage();
        y2 = margin;
      }
      doc.text(line, margin, y2, { maxWidth: pageWidth - 2 * margin });
      y2 += line === "" ? 2 : 4;
    });
  }

  // Format filename
  const docTypePrefix = {
    'quote': 'DEVIS',
    'purchase_order': 'BON_DE_COMMANDE',
    'delivery_note': 'LIVRAISON',
    'invoice': 'FACTURE',
    'receipt': 'TICKET',
    'credit_note': 'CREDIT',
    'proforma': 'PROFORMA'
  };
  const prefix = docTypePrefix[document.doc_type] || 'DOCUMENT';
  const filename = `${prefix}_${document.number}.pdf`;

  if (openInNewTab) {
    // Open in new tab
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } else {
    // Download
    doc.save(filename);
  }

  return doc;
};
