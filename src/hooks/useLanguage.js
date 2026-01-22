import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Translation keys
const translations = {
  fr: {
    // Navigation
    nav_pos: "Caisse",
    nav_documents: "Documents",
    nav_products: "Produits",
    nav_inventory: "Stock",
    nav_clients: "Clients",
    nav_users: "Utilisateurs",
    nav_reports: "Rapports",
    nav_settings: "Paramètres",
    nav_cash_register: "Tiroir-caisse",
    nav_returns: "Retours",
    
    // Common
    search: "Rechercher",
    search_collection: "Rechercher une collection...",
    add: "Ajouter",
    add_quick_product: "Ajouter produit rapide",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    close: "Fermer",
    actions: "Actions",
    date: "Date",
    status: "Statut",
    total: "Total",
    quantity: "Quantité",
    price: "Prix",
    discount: "Remise",
    subtotal: "Sous-total",
    vat: "TVA",
    amount: "Montant",
    reference: "Référence",
    customer: "Client",
    client: "Client",
    payment: "Paiement",
    confirm: "Confirmer",
    back: "Retour",
    return: "Retour",
    next: "Suivant",
    print: "Imprimer",
    print_a4: "Imprimer A4",
    ticket_80mm: "Ticket 80mm",
    download: "Télécharger",
    export: "Exporter",
    import: "Importer",
    filter: "Filtrer",
    refresh: "Actualiser",
    view: "Voir",
    details: "Détails",
    duplicate: "Dupliquer",
    open_pdf: "Ouvrir PDF",
    create_return: "Créer un retour",
    convert: "Convertir",
    pay: "Payer",
    checkout: "Passer en caisse",
    
    // Document fields
    invoice_number: "N° de facture",
    due_date: "Date d'échéance",
    vendor: "Vendeur",
    seller: "Vendeur / Verkoper",
    
    // Document types
    doc_quote: "Devis",
    doc_purchase_order: "Bon de commande",
    doc_delivery_note: "Bon de livraison",
    doc_invoice: "Facture",
    doc_credit_note: "Note de crédit",
    doc_receipt: "Ticket",
    doc_proforma: "Proforma",
    
    // Status
    status_draft: "Brouillon",
    status_sent: "Envoyé",
    status_accepted: "Accepté",
    status_confirmed: "Confirmé",
    status_delivered: "Livré",
    status_invoiced: "Facturé",
    status_unpaid: "Impayé",
    status_partially_paid: "Partiellement payé",
    status_paid: "Payé",
    status_cancelled: "Annulé",
    status_credited: "Crédité",
    
    // Payment methods
    payment_cash: "Espèces",
    payment_card: "Carte bancaire",
    payment_bank_transfer: "Virement bancaire",
    
    // POS
    pos_add_to_cart: "Ajouter au panier",
    pos_cart: "Panier",
    pos_empty_cart: "Panier vide",
    pos_clear_cart: "Vider le panier",
    pos_checkout: "Passer en caisse",
    pos_customer_select: "Sélectionner un client",
    pos_scan_barcode: "Scanner code-barres",
    pos_pay: "PAYER",
    
    // Documents
    documents_hub: "Centre de documents",
    documents_create: "Nouveau document",
    documents_list: "Liste des documents",
    documents_search: "Rechercher un document",
    documents_filter: "Filtrer les documents",
    documents_total: "Total des documents",
    
    // Products
    products_list: "Liste des produits",
    products_add: "Ajouter un produit",
    products_edit: "Modifier le produit",
    products_stock: "Stock disponible",
    products_category: "Catégorie",
    products_sku: "Référence",
    products_price: "Prix de vente",
    
    // Customers
    customers_list: "Liste des clients",
    customers_add: "Ajouter un client",
    customers_edit: "Modifier le client",
    customers_name: "Nom du client",
    customers_email: "Email",
    customers_phone: "Téléphone",
    customers_address: "Adresse",
    customers_vat: "Numéro TVA",
    
    // Messages
    msg_save_success: "Enregistré avec succès",
    msg_save_error: "Erreur lors de l'enregistrement",
    msg_delete_confirm: "Êtes-vous sûr de vouloir supprimer ?",
    msg_delete_success: "Supprimé avec succès",
    msg_loading: "Chargement...",
    msg_no_results: "Aucun résultat",
  },
  
  nl: {
    // Navigation
    nav_pos: "Kassa",
    nav_documents: "Documenten",
    nav_products: "Producten",
    nav_inventory: "Voorraad",
    nav_clients: "Klanten",
    nav_users: "Gebruikers",
    nav_reports: "Rapporten",
    nav_settings: "Instellingen",
    nav_cash_register: "Kassalade",
    nav_returns: "Retouren",
    
    // Common
    search: "Zoeken",
    search_collection: "Zoek een collectie...",
    add: "Toevoegen",
    add_quick_product: "Snel product toevoegen",
    edit: "Wijzigen",
    delete: "Verwijderen",
    save: "Opslaan",
    cancel: "Annuleren",
    close: "Sluiten",
    actions: "Acties",
    date: "Datum",
    status: "Status",
    total: "Totaal",
    quantity: "Hoeveelheid",
    price: "Prijs",
    discount: "Korting",
    subtotal: "Subtotaal",
    vat: "BTW",
    amount: "Bedrag",
    reference: "Referentie",
    customer: "Klant",
    client: "Klant",
    payment: "Betaling",
    confirm: "Bevestigen",
    back: "Terug",
    return: "Terug",
    next: "Volgende",
    print: "Afdrukken",
    print_a4: "Afdrukken A4",
    ticket_80mm: "Ticket 80mm",
    download: "Downloaden",
    export: "Exporteren",
    import: "Importeren",
    filter: "Filteren",
    refresh: "Vernieuwen",
    view: "Bekijken",
    details: "Details",
    duplicate: "Dupliceren",
    open_pdf: "Open PDF",
    create_return: "Maak een retour aan",
    convert: "Converteren",
    pay: "Betalen",
    checkout: "Afrekenen",
    
    // Document fields
    invoice_number: "Factuurnr.",
    due_date: "Vervaldatum",
    vendor: "Verkoper",
    seller: "Verkoper / Vendeur",
    
    // Document types
    doc_quote: "Offerte",
    doc_purchase_order: "Bestelbon",
    doc_delivery_note: "Leveringsbon",
    doc_invoice: "Factuur",
    doc_credit_note: "Creditnota",
    doc_receipt: "Kassabon",
    doc_proforma: "Proforma",
    
    // Status
    status_draft: "Concept",
    status_sent: "Verzonden",
    status_accepted: "Aanvaard",
    status_confirmed: "Bevestigd",
    status_delivered: "Geleverd",
    status_invoiced: "Gefactureerd",
    status_unpaid: "Onbetaald",
    status_partially_paid: "Gedeeltelijk betaald",
    status_paid: "Betaald",
    status_cancelled: "Geannuleerd",
    status_credited: "Gecrediteerd",
    
    // Payment methods
    payment_cash: "Contant",
    payment_card: "Bankkaart",
    payment_bank_transfer: "Overschrijving",
    
    // POS
    pos_add_to_cart: "Toevoegen aan winkelwagen",
    pos_cart: "Winkelwagen",
    pos_empty_cart: "Lege winkelwagen",
    pos_clear_cart: "Winkelwagen legen",
    pos_checkout: "Afrekenen",
    pos_customer_select: "Selecteer een klant",
    pos_scan_barcode: "Scan barcode",
    pos_pay: "BETALEN",
    
    // Documents
    documents_hub: "Documentencentrum",
    documents_create: "Nieuw document",
    documents_list: "Documentenlijst",
    documents_search: "Zoek een document",
    documents_filter: "Filter documenten",
    documents_total: "Totaal documenten",
    
    // Products
    products_list: "Productenlijst",
    products_add: "Product toevoegen",
    products_edit: "Product wijzigen",
    products_stock: "Beschikbare voorraad",
    products_category: "Categorie",
    products_sku: "Referentie",
    products_price: "Verkoopprijs",
    
    // Customers
    customers_list: "Klantenlijst",
    customers_add: "Klant toevoegen",
    customers_edit: "Klant wijzigen",
    customers_name: "Naam van de klant",
    customers_email: "E-mail",
    customers_phone: "Telefoon",
    customers_address: "Adres",
    customers_vat: "BTW-nummer",
    
    // Messages
    msg_save_success: "Succesvol opgeslagen",
    msg_save_error: "Fout bij het opslaan",
    msg_delete_confirm: "Weet u zeker dat u wilt verwijderen?",
    msg_delete_success: "Succesvol verwijderd",
    msg_loading: "Laden...",
    msg_no_results: "Geen resultaten",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to French
    return localStorage.getItem('app_language') || 'fr';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'nl' : 'fr');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
