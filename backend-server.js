const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const peppyrusService = require('./peppyrus-service');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Serve uploaded images
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Mock data
let categories = [
  { id: 1, name_fr: "Carrelage", name_nl: "Tegels", slug: "carrelage", product_count: 25, image_url: null, active: true },
  { id: 2, name_fr: "Sanitaire", name_nl: "Sanitair", slug: "sanitaire", product_count: 18, image_url: null, active: true },
  { id: 3, name_fr: "Quincaillerie", name_nl: "IJzerwaren", slug: "quincaillerie", product_count: 42, image_url: null, active: true },
  { id: 4, name_fr: "Peinture", name_nl: "Verf", slug: "peinture", product_count: 15, image_url: null, active: true },
  { id: 5, name_fr: "Outillage", name_nl: "Gereedschap", slug: "outillage", product_count: 30, image_url: null, active: true },
];
let categoryCounter = 6;

let products = [
  // Carrelage
  { id: 1, category_id: 1, sku: "CAR-001", name_fr: "Carrelage Blanc 30x30", name_nl: "Witte Tegel 30x30", price_retail: 12.50, stock_qty: 150, unit: "m²", vat_rate: 21, image_url: null, barcode: "1234567890123", gtin: "1234567890123" },
  { id: 2, category_id: 1, sku: "CAR-002", name_fr: "Carrelage Gris 60x60", name_nl: "Grijze Tegel 60x60", price_retail: 25.00, stock_qty: 80, unit: "m²", vat_rate: 21, image_url: null, barcode: "1234567890124", gtin: "1234567890124" },
  { id: 3, category_id: 1, sku: "CAR-003", name_fr: "Carrelage Noir 45x45", name_nl: "Zwarte Tegel 45x45", price_retail: 18.75, stock_qty: 120, unit: "m²", vat_rate: 21, image_url: null, barcode: "1234567890125", gtin: "1234567890125" },

  // Sanitaire
  { id: 4, category_id: 2, sku: "SAN-001", name_fr: "Lavabo Blanc", name_nl: "Witte Wastafel", price_retail: 125.00, stock_qty: 15, unit: "pièce", vat_rate: 21, image_url: null, barcode: "2234567890123", gtin: "2234567890123" },
  { id: 5, category_id: 2, sku: "SAN-002", name_fr: "WC Suspendu", name_nl: "Hangend Toilet", price_retail: 235.00, stock_qty: 8, unit: "pièce", vat_rate: 21, image_url: null, barcode: "2234567890124", gtin: "2234567890124" },
  { id: 6, category_id: 2, sku: "SAN-003", name_fr: "Robinet Mitigeur", name_nl: "Mengkraan", price_retail: 85.50, stock_qty: 25, unit: "pièce", vat_rate: 21, image_url: null, barcode: "2234567890125", gtin: "2234567890125" },

  // Quincaillerie
  { id: 7, category_id: 3, sku: "QUI-001", name_fr: "Vis 4x50mm - Boîte 100", name_nl: "Schroef 4x50mm - Doos 100", price_retail: 5.25, stock_qty: 200, unit: "boîte", vat_rate: 21, image_url: null, barcode: "3234567890123", gtin: "3234567890123" },
  { id: 8, category_id: 3, sku: "QUI-002", name_fr: "Cheville 8mm - Boîte 50", name_nl: "Plug 8mm - Doos 50", price_retail: 3.75, stock_qty: 180, unit: "boîte", vat_rate: 21, image_url: null, barcode: "3234567890124", gtin: "3234567890124" },
  { id: 9, category_id: 3, sku: "QUI-003", name_fr: "Serrure Porte", name_nl: "Deurslot", price_retail: 45.00, stock_qty: 35, unit: "pièce", vat_rate: 21, image_url: null, barcode: "3234567890125", gtin: "3234567890125" },

  // Peinture
  { id: 10, category_id: 4, sku: "PEI-001", name_fr: "Peinture Blanche 10L", name_nl: "Witte Verf 10L", price_retail: 42.50, stock_qty: 60, unit: "L", vat_rate: 21, image_url: null, barcode: "4234567890123", gtin: "4234567890123" },
  { id: 11, category_id: 4, sku: "PEI-002", name_fr: "Peinture Grise 5L", name_nl: "Grijze Verf 5L", price_retail: 28.00, stock_qty: 45, unit: "L", vat_rate: 21, image_url: null, barcode: "4234567890124", gtin: "4234567890124" },

  // Outillage
  { id: 12, category_id: 5, sku: "OUT-001", name_fr: "Marteau", name_nl: "Hamer", price_retail: 15.50, stock_qty: 50, unit: "pièce", vat_rate: 21, image_url: null, barcode: "5234567890123", gtin: "5234567890123" },
  { id: 13, category_id: 5, sku: "OUT-002", name_fr: "Tournevis Set", name_nl: "Schroevendraaier Set", price_retail: 22.00, stock_qty: 40, unit: "set", vat_rate: 21, image_url: null, barcode: "5234567890124", gtin: "5234567890124" },
  { id: 14, category_id: 5, sku: "OUT-003", name_fr: "Perceuse Sans Fil", name_nl: "Draadloze Boormachine", price_retail: 125.00, stock_qty: 12, unit: "pièce", vat_rate: 21, image_url: null, barcode: "5234567890125", gtin: "5234567890125" },
];
let productCounter = 15;

function recalcCategoryCounts() {
  categories = categories.map(c => ({
    ...c,
    product_count: products.filter(p => p.category_id === c.id).length
  }));
}

let customers = [
  { id: 1, name: "Jean Dupont", email: "jean.dupont@email.com", phone: "+32 475 12 34 56", address: "Rue de la Paix 123, 1000 Brussels", vat_number: "BE0123456789", peppol_id: "0196:BE0123456789", credit_balance: 0 },
  { id: 2, name: "Marie Martin", email: "marie.martin@email.com", phone: "+32 475 98 76 54", address: "Avenue Louise 45, 1050 Brussels", vat_number: "BE0987654321", peppol_id: null, credit_balance: 0 },
  { id: 3, name: "Pierre Dubois", email: "pierre.dubois@email.com", phone: "+32 475 11 22 33", address: "Chaussée de Waterloo 78, 1060 Brussels", vat_number: "BE0111222333", peppol_id: "0196:BE0111222333", credit_balance: 0 },
];

let sales = [];
let documents = [];
let saleCounter = 1;
let docCounter = 1;

// Returns & Credit Notes data structures
let returns = [];
let returnCounter = 1;
let creditNotes = [];
let creditNoteCounter = 1;
let refunds = [];
let refundCounter = 1;
let customerCreditLedger = [];
let creditLedgerCounter = 1;

let shifts = [];
let currentShift = null;
let shiftCounter = 1;

let users = [
  {
    id: 1,
    username: 'admin',
    full_name: 'Admin',
    email: 'admin@example.com',
    phone: '',
    role: 'admin',
    is_active: true
  },
  {
    id: 2,
    username: 'cashier',
    full_name: 'Cashier',
    email: 'cashier@example.com',
    phone: '',
    role: 'cashier',
    is_active: true
  }
];
let userCounter = 3;

// Settings data
let companySettings = {
  company_name: "My Company",
  legal_name: "My Company SPRL",
  company_id: "",
  vat_number: "BE0123456789",
  peppol_id: "",
  street_name: "Rue de la Paix",
  building_number: "123",
  address_line: "",
  city: "Brussels",
  postal_code: "1000",
  country: "BE",
  phone: "+32 2 123 45 67",
  email: "info@mycompany.be",
  website: "www.mycompany.be",
  bank_account_iban: "BE68539007547034",
  bank_account_bic: "GEBABEBB",
  bank_name: "BNP Paribas Fortis",
  default_payment_terms_days: 30,
  invoice_footer_text: "Merci pour votre confiance",
  quote_footer_text: "Devis valable 30 jours"
};

let peppyrusSettings = {
  enabled: false,
  api_key: "",
  api_secret: "",
  api_url: "https://api.peppyrus.be",
  sender_id: "",
  test_mode: true,
  auto_send_invoices: false
};

let shopifySettings = {
  enabled: false,
  shop_url: "",
  access_token: "",
  api_key: "",
  api_secret: "",
  auto_sync: false,
  sync_interval_minutes: 30,
  last_sync: null
};

let syncLogs = [];
let unmappedProducts = [];

// Persistence Helper
function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      if (settings.company) companySettings = { ...companySettings, ...settings.company };
      if (settings.peppyrus) peppyrusSettings = { ...peppyrusSettings, ...settings.peppyrus };
      if (settings.shopify) shopifySettings = { ...shopifySettings, ...settings.shopify };
      console.log('✅ Settings loaded from disk');
    } catch (err) {
      console.error('❌ Error loading settings:', err);
    }
  }
}

function saveSettings() {
  try {
    const settings = {
      company: companySettings,
      peppyrus: peppyrusSettings,
      shopify: shopifySettings
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('💾 Settings saved to disk');
  } catch (err) {
    console.error('❌ Error saving settings:', err);
  }
}

// Load settings on startup
loadSettings();

// Routes
app.get('/api/categories', (req, res) => {
  console.log('GET /api/categories');
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  console.log('POST /api/categories', req.body);
  try {
    const newCategory = {
      id: categoryCounter++,
      name_fr: req.body.name_fr,
      name_nl: req.body.name_nl,
      slug: req.body.slug || req.body.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image_url: req.body.image_url || null,
      active: req.body.active !== false,
      product_count: 0
    };
    categories.push(newCategory);
    res.json(newCategory);
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/uploads', async (req, res) => {
  console.log('POST /api/uploads');

  try {
    // Handle multipart/form-data manually for simplicity
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found' });
    }

    // Collect raw body
    let body = [];
    req.on('data', chunk => body.push(chunk));

    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    const buffer = Buffer.concat(body);
    const boundaryBuffer = Buffer.from(`--${boundary}`);

    // Find file content between boundaries
    const parts = [];
    let start = 0;

    while (start < buffer.length) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
      if (boundaryIndex === -1) break;

      if (start > 0) {
        parts.push(buffer.slice(start, boundaryIndex));
      }

      start = boundaryIndex + boundaryBuffer.length;
    }

    // Find the file part (has Content-Type header)
    let fileBuffer = null;
    let fileExtension = '.jpg';

    for (const part of parts) {
      const partStr = part.toString('binary', 0, Math.min(part.length, 500));

      if (partStr.includes('Content-Type: image/')) {
        // Extract MIME type
        if (partStr.includes('image/png')) fileExtension = '.png';
        else if (partStr.includes('image/gif')) fileExtension = '.gif';
        else if (partStr.includes('image/webp')) fileExtension = '.webp';
        else if (partStr.includes('image/jpeg') || partStr.includes('image/jpg')) fileExtension = '.jpg';

        // Find double CRLF (end of headers)
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          // Skip headers and trailing CRLF
          fileBuffer = part.slice(headerEnd + 4, part.length - 2);
          break;
        }
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No valid image file found' });
    }

    // Check size
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    }

    // Save file
    const filename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, fileBuffer);

    const url = `http://localhost:${PORT}/uploads/${filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

app.post('/api/images/import', async (req, res) => {
  console.log('POST /api/images/import', req.body.url);

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // SSRF Protection
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are allowed' });
    }

    // Block private IPs
    const hostname = parsedUrl.hostname;
    const privateIPPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^::1$/,
      /^fe80:/i,
      /^fc00:/i
    ];

    if (privateIPPatterns.some(pattern => pattern.test(hostname))) {
      return res.status(400).json({ error: 'Private IP addresses are not allowed' });
    }

    // Download image
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    await new Promise((resolve, reject) => {
      const request = protocol.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'ALPHA-POS-ImageImporter/1.0'
        }
      }, (response) => {
        // Check size limit (5MB)
        const contentLength = parseInt(response.headers['content-length'] || '0');
        if (contentLength > 5 * 1024 * 1024) {
          reject(new Error('Image too large (max 5MB)'));
          response.destroy();
          return;
        }

        // Check content type
        const contentType = response.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
          reject(new Error('URL does not point to an image'));
          response.destroy();
          return;
        }

        // Determine file extension
        let ext = '.jpg';
        if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('gif')) ext = '.gif';
        else if (contentType.includes('webp')) ext = '.webp';

        // Generate filename
        const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Save to file
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          const localUrl = `http://localhost:${PORT}/uploads/${filename}`;
          resolve(localUrl);
        });

        fileStream.on('error', reject);
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    }).then(localUrl => {
      res.json({ url: localUrl });
    }).catch(error => {
      throw error;
    });

  } catch (error) {
    console.error('Image import error:', error);
    res.status(500).json({ error: error.message || 'Import failed' });
  }
});

app.get('/api/products', (req, res) => {
  const { category_id } = req.query;
  console.log(`GET /api/products?category_id=${category_id || 'all'}`);

  if (category_id) {
    const filtered = products.filter(p => p.category_id == category_id);
    console.log(`Returning ${filtered.length} products for category ${category_id}`);
    res.json(filtered);
  } else {
    console.log(`Returning all ${products.length} products`);
    res.json(products);
  }
});

app.post('/api/products', (req, res) => {
  console.log('POST /api/products', req.body);
  try {
    const newProduct = {
      id: productCounter++,
      category_id: req.body.category_id || null,
      sku: req.body.sku,
      name_fr: req.body.name_fr,
      name_nl: req.body.name_nl,
      price_retail: req.body.price_retail || 0,
      price_wholesale: req.body.price_wholesale || null,
      price_purchase: req.body.price_purchase || null,
      compare_at_price: req.body.compare_at_price || null,
      stock_qty: req.body.stock_qty || 0,
      min_stock: req.body.min_stock || 0,
      unit: req.body.unit || 'pièce',
      vat_rate: req.body.vat_rate || 21,
      barcode: req.body.barcode || null,
      gtin: req.body.gtin || null,
      vendor: req.body.vendor || null,
      weight: req.body.weight || null,
      weight_unit: req.body.weight_unit || 'kg',
      description_fr: req.body.description_fr || null,
      description_nl: req.body.description_nl || null,
      image_url: req.body.image_url || null,
      tags: req.body.tags || null,
      variant_title: req.body.variant_title || null,
      size: req.body.size || null,
      color: req.body.color || null,
      material: req.body.material || null,
      attributes: req.body.attributes || null // Store attributes as JSON
    };
    products.push(newProduct);
    console.log(`Product created with ID ${newProduct.id}. Total products: ${products.length}`);
    recalcCategoryCounts();
    console.log('Categories recalculated. Sending response...');
    res.json(newProduct);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  console.log('PUT /api/products/:id', req.params.id);
  try {
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product, preserving id
    products[index] = {
      ...products[index],
      ...req.body,
      id: products[index].id
    };

    recalcCategoryCounts();
    res.json(products[index]);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  console.log('DELETE /api/products/:id', req.params.id);
  try {
    const before = products.length;
    products = products.filter(p => p.id != req.params.id);
    if (products.length === before) {
      return res.status(404).json({ error: 'Product not found' });
    }
    recalcCategoryCounts();
    res.json({ success: true });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stock-alerts', (req, res) => {
  console.log('GET /api/stock-alerts');
  const minStock = 10;
  const alerts = products
    .filter(p => (p.stock_qty ?? 0) <= minStock)
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name_fr: p.name_fr,
      name_nl: p.name_nl,
      stock_qty: p.stock_qty,
      min_stock: minStock
    }));
  res.json(alerts);
});

app.get('/api/shifts/current', (req, res) => {
  console.log('GET /api/shifts/current');
  if (!currentShift) {
    res.json({ status: 'no_shift' });
    return;
  }
  res.json(currentShift);
});

app.get('/api/shifts', (req, res) => {
  const limit = parseInt(req.query.limit || '10');
  console.log(`GET /api/shifts?limit=${limit}`);
  res.json(shifts.slice(0, limit));
});

app.post('/api/shifts/open', (req, res) => {
  console.log('POST /api/shifts/open', req.body);
  if (currentShift) {
    res.status(400).json({ detail: 'Shift already open' });
    return;
  }

  const shift = {
    id: shiftCounter++,
    status: 'open',
    opened_at: new Date().toISOString(),
    closed_at: null,
    opening_cash: req.body.opening_cash ?? 0,
    counted_cash: null,
    cashier_name: req.body.cashier_name || 'Caissier',
    register_number: req.body.register_number ?? 1
  };

  currentShift = shift;
  shifts.unshift(shift);
  res.json(shift);
});

app.post('/api/shifts/close', (req, res) => {
  console.log('POST /api/shifts/close', req.body);
  if (!currentShift) {
    res.status(400).json({ detail: 'No open shift' });
    return;
  }

  currentShift = {
    ...currentShift,
    status: 'closed',
    closed_at: new Date().toISOString(),
    counted_cash: req.body.counted_cash ?? null,
    close_notes: req.body.close_notes || ''
  };

  const index = shifts.findIndex(s => s.id === currentShift.id);
  if (index !== -1) {
    shifts[index] = currentShift;
  }

  const closed = currentShift;
  currentShift = null;
  res.json(closed);
});

app.get('/api/users', (req, res) => {
  const activeOnly = req.query.active_only === 'true';
  console.log(`GET /api/users?active_only=${req.query.active_only}`);
  const result = activeOnly ? users.filter(u => u.is_active) : users;
  res.json(result);
});

app.post('/api/users', (req, res) => {
  console.log('POST /api/users', req.body?.username);
  const newUser = {
    id: userCounter++,
    username: req.body.username,
    full_name: req.body.full_name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    role: req.body.role || 'cashier',
    is_active: req.body.is_active !== false
  };
  users.push(newUser);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  console.log('PUT /api/users/:id', req.params.id);
  const index = users.findIndex(u => u.id == req.params.id);
  if (index === -1) {
    res.status(404).json({ detail: 'User not found' });
    return;
  }
  users[index] = { ...users[index], ...req.body, id: users[index].id };
  res.json(users[index]);
});

app.delete('/api/users/:id', (req, res) => {
  console.log('DELETE /api/users/:id', req.params.id);
  const before = users.length;
  users = users.filter(u => u.id != req.params.id);
  if (users.length === before) {
    res.status(404).json({ detail: 'User not found' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/users/:id/stats', (req, res) => {
  console.log('GET /api/users/:id/stats', req.params.id);
  // Simple mock stats to satisfy UI
  res.json({
    total_sales: 0,
    total_revenue: 0,
    average_sale: 0,
    last_login: null,
    created_at: new Date().toISOString()
  });
});

app.get('/api/reports/dashboard', (req, res) => {
  const { date_from, date_to } = req.query;
  console.log(`GET /api/reports/dashboard?date_from=${date_from}&date_to=${date_to}`);

  try {
    // Parse dates and add 1 day to date_to to include the end date
    const startDate = date_from ? new Date(date_from + 'T00:00:00') : new Date(0);
    const endDate = date_to ? new Date(date_to + 'T23:59:59.999') : new Date();

    console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Filter sales and documents (invoices/receipts) by date
    const filteredSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredDocs = documents.filter(d => {
      if (!['invoice', 'receipt'].includes(d.doc_type)) return false;
      const docDate = new Date(d.date);
      return docDate >= startDate && docDate <= endDate;
    });

    console.log(`Found ${filteredSales.length} sales and ${filteredDocs.length} documents`);

    // Calculate totals
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0) +
      filteredDocs.reduce((sum, d) => sum + (d.total || 0), 0);

    const transactionsCount = filteredSales.length + filteredDocs.length;

    // Count products sold
    let productsSold = 0;
    filteredSales.forEach(s => {
      if (s.items) {
        productsSold += s.items.reduce((sum, item) => sum + (item.qty || 0), 0);
      }
    });
    filteredDocs.forEach(d => {
      if (d.items) {
        productsSold += d.items.reduce((sum, item) => sum + (item.qty || 0), 0);
      }
    });

    // Count unique customers
    const customerIds = new Set();
    filteredSales.forEach(s => { if (s.customer_id) customerIds.add(s.customer_id); });
    filteredDocs.forEach(d => { if (d.customer_id) customerIds.add(d.customer_id); });

    const averageTicket = transactionsCount > 0 ? totalSales / transactionsCount : 0;

    // Calculate top products
    const productStats = {};
    [...filteredSales, ...filteredDocs].forEach(record => {
      if (record.items) {
        record.items.forEach(item => {
          const key = item.product_id || item.sku || item.name;
          if (!productStats[key]) {
            productStats[key] = {
              name: item.name,
              qty: 0,
              revenue: 0
            };
          }
          productStats[key].qty += item.qty || 0;
          productStats[key].revenue += (item.qty || 0) * (item.unit_price || 0);
        });
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate payment methods breakdown
    const paymentMethods = {};
    [...filteredSales, ...filteredDocs].forEach(record => {
      if (record.payments && Array.isArray(record.payments)) {
        record.payments.forEach(payment => {
          const method = payment.method || 'unknown';
          if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
          }
          paymentMethods[method] += payment.amount || 0;
        });
      }
    });

    // Calculate daily trend
    const dailyTrend = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayStart = new Date(dateStr + 'T00:00:00');
      const dayEnd = new Date(dateStr + 'T23:59:59.999');

      const dayTotal = [...filteredSales, ...filteredDocs]
        .filter(r => {
          const d = new Date(r.date);
          return d >= dayStart && d <= dayEnd;
        })
        .reduce((sum, r) => sum + (r.total || 0), 0);

      dailyTrend.push({
        date: dateStr,
        total: dayTotal
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const response = {
      summary: {
        total_sales: totalSales,
        transactions_count: transactionsCount,
        products_sold: productsSold,
        active_customers: customerIds.size,
        average_ticket: averageTicket
      },
      top_products: topProducts,
      payment_methods: paymentMethods,
      daily_trend: dailyTrend
    };

    console.log('Dashboard data:', JSON.stringify(response.summary, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/vat', (req, res) => {
  const { date_from, date_to } = req.query;
  console.log(`GET /api/reports/vat?date_from=${date_from}&date_to=${date_to}`);

  try {
    // Parse dates
    const startDate = date_from ? new Date(date_from + 'T00:00:00') : new Date(0);
    const endDate = date_to ? new Date(date_to + 'T23:59:59.999') : new Date();

    // Filter sales and documents by date
    const filteredRecords = [...sales, ...documents.filter(d => ['invoice', 'receipt'].includes(d.doc_type))]
      .filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

    // Calculate VAT by rate
    const vatBreakdown = {};
    filteredRecords.forEach(record => {
      if (record.items) {
        record.items.forEach(item => {
          const rate = item.vat_rate || 21;
          if (!vatBreakdown[rate]) {
            vatBreakdown[rate] = { base: 0, vat: 0, total: 0 };
          }

          const lineTotal = (item.qty || 0) * (item.unit_price || 0);
          const lineVat = lineTotal * (rate / 100);

          vatBreakdown[rate].base += lineTotal;
          vatBreakdown[rate].vat += lineVat;
          vatBreakdown[rate].total += lineTotal + lineVat;
        });
      }
    });

    // Convert to array and calculate totals
    const breakdown = Object.entries(vatBreakdown)
      .map(([rate, data]) => ({
        rate: parseFloat(rate),
        ...data
      }))
      .sort((a, b) => b.rate - a.rate);

    const totals = breakdown.reduce((acc, item) => ({
      base: acc.base + item.base,
      vat: acc.vat + item.vat,
      total: acc.total + item.total
    }), { base: 0, vat: 0, total: 0 });

    res.json({
      breakdown,
      totals
    });
  } catch (error) {
    console.error('VAT report error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/inventory', (req, res) => {
  console.log('GET /api/reports/inventory');

  try {
    const totalValue = products.reduce((sum, p) => sum + ((p.stock_qty || 0) * (p.price_retail || 0)), 0);
    const lowStockItems = products.filter(p => (p.stock_qty || 0) > 0 && (p.stock_qty || 0) <= (p.min_stock || 10));
    const outOfStockItems = products.filter(p => (p.stock_qty || 0) === 0);

    res.json({
      summary: {
        total_products: products.length,
        total_value: totalValue,
        low_stock_count: lowStockItems.length,
        out_of_stock_count: outOfStockItems.length
      },
      low_stock: lowStockItems.map(p => ({
        id: p.id,
        sku: p.sku,
        name_fr: p.name_fr,
        name: p.name_fr,
        stock_qty: p.stock_qty,
        min_stock: p.min_stock || 10
      })),
      out_of_stock: outOfStockItems.map(p => ({
        id: p.id,
        sku: p.sku,
        name_fr: p.name_fr,
        name: p.name_fr
      }))
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', (req, res) => {
  console.log('GET /api/customers');
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id == req.params.id);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

app.post('/api/customers', (req, res) => {
  console.log('POST /api/customers', req.body);
  const newCustomer = {
    id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
    ...req.body
  };
  customers.push(newCustomer);
  res.json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  console.log('PUT /api/customers/:id', req.params.id);
  const index = customers.findIndex(c => c.id == req.params.id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...req.body, id: customers[index].id };
    res.json(customers[index]);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

app.post('/api/sales', (req, res) => {
  console.log('POST /api/sales');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const sale = {
      id: saleCounter++,
      number: `VTE-${String(saleCounter).padStart(6, '0')}`,
      date: new Date().toISOString(),
      ...req.body,
      total: calculateTotal(req.body.items, req.body.global_discount_type, req.body.global_discount_value)
    };
    sales.push(sale);

    // Update stock
    req.body.items.forEach(item => {
      const product = products.find(p => p.id == item.product_id);
      if (product) {
        product.stock_qty -= item.qty;
      }
    });

    console.log('Sale created:', sale.number);
    res.json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents', (req, res) => {
  console.log('POST /api/documents', req.body.doc_type);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const doc = {
      id: docCounter++,
      number: `${getDocPrefix(req.body.doc_type)}-${String(docCounter).padStart(6, '0')}`,
      date: new Date().toISOString(),
      ...req.body,
      total: calculateTotal(req.body.items, req.body.global_discount_type, req.body.global_discount_value)
    };

    // Handle payments if provided
    if (req.body.payments && Array.isArray(req.body.payments) && req.body.payments.length > 0) {
      doc.payments = req.body.payments;
      doc.paid_total = req.body.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // If fully paid, update status
      if (doc.paid_total >= doc.total) {
        doc.status = "paid";
      }
    } else {
      doc.payments = [];
      doc.paid_total = 0;
    }

    // Add IDs to items for tracking
    if (doc.items) {
      doc.items = doc.items.map((item, idx) => ({
        ...item,
        id: idx + 1,
        vat_rate: item.vat_rate || 21
      }));
    }

    // Update stock for invoices ONLY if NOT linked to a sale
    // (if sale_id is present, stock was already updated when sale was created)
    if (req.body.doc_type === "invoice" && req.body.items && !req.body.sale_id) {
      req.body.items.forEach(item => {
        const product = products.find(p => p.id == item.product_id);
        if (product) {
          product.stock_qty -= item.qty;
          console.log(`Stock updated for ${product.sku}: ${product.stock_qty}`);
        }
      });
    }

    documents.push(doc);
    console.log('Document created:', doc.number);
    res.json(doc);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents', (req, res) => {
  const { doc_type, limit } = req.query;
  const parsedLimit = parseInt(limit || '200');
  console.log(`GET /api/documents?doc_type=${doc_type || ''}&limit=${parsedLimit}`);

  let result = documents;
  if (doc_type) {
    result = result.filter(d => d.doc_type === doc_type);
  }

  // Return newest first (by date)
  result = [...result].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(result.slice(0, isNaN(parsedLimit) ? 200 : parsedLimit));
});

app.get('/api/documents/:id', (req, res) => {
  const doc = documents.find(d => d.id == req.params.id);
  if (doc) {
    res.json(doc);
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

// Generate PDF for document
app.get('/api/documents/:id/pdf', (req, res) => {
  console.log('GET /api/documents/:id/pdf', req.params.id);
  const doc = documents.find(d => d.id == req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  // For now, return a simple message - in production this would generate actual PDF
  // You can integrate with libraries like pdfkit, puppeteer, or use frontend PDF generation
  res.json({
    message: 'PDF generation not implemented in backend yet',
    suggestion: 'Use frontend PDF generation with pdfGenerator.js'
  });
});

// Helper: Determine stock impact and status for new document
function getDocumentDefaults(doc_type, source_doc_type = null) {
  const defaults = {
    status: 'draft',
    should_decrease_stock: false
  };

  switch (doc_type) {
    case 'quote':
      defaults.status = 'draft';
      break;
    case 'purchase_order':
      defaults.status = 'confirmed';
      break;
    case 'delivery_note':
      defaults.status = 'delivered';
      defaults.should_decrease_stock = true; // ALWAYS decrease stock on delivery
      break;
    case 'invoice':
      defaults.status = 'unpaid';
      // Only decrease stock if NOT coming from delivery_note (already decreased)
      defaults.should_decrease_stock = source_doc_type !== 'delivery_note';
      break;
    case 'credit_note':
      defaults.status = 'draft';
      // Stock increase handled by Returns module
      break;
    default:
      defaults.status = 'draft';
  }

  return defaults;
}

// Convert document to another type
app.post('/api/documents/:id/convert', (req, res) => {
  console.log('POST /api/documents/:id/convert', req.params.id, req.query.target_type);
  const sourceDoc = documents.find(d => d.id == req.params.id);
  if (!sourceDoc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const targetType = req.query.target_type;
  if (!targetType) {
    res.status(400).json({ error: 'target_type required' });
    return;
  }

  try {
    const defaults = getDocumentDefaults(targetType, sourceDoc.doc_type);

    // Create new document based on source
    const newDoc = {
      id: docCounter++,
      number: `${getDocPrefix(targetType)}-${String(docCounter).padStart(6, '0')}`,
      date: new Date().toISOString(),
      doc_type: targetType,
      customer_id: sourceDoc.customer_id,
      customer_name: sourceDoc.customer_name,
      customer_vat: sourceDoc.customer_vat,
      customer_address: sourceDoc.customer_address,
      customer_reference: sourceDoc.customer_reference,
      items: sourceDoc.items.map(item => ({ ...item })),
      payments: [],
      global_discount_type: sourceDoc.global_discount_type,
      global_discount_value: sourceDoc.global_discount_value,
      currency: sourceDoc.currency || "EUR",
      total: sourceDoc.total,
      paid_total: 0,
      status: defaults.status,
      source_document_id: sourceDoc.id,
      source_document_type: sourceDoc.doc_type,
      source_document_number: sourceDoc.number
    };

    // Update source document status
    if (sourceDoc.doc_type === 'quote' && ['purchase_order', 'delivery_note', 'invoice'].includes(targetType)) {
      sourceDoc.status = 'accepted';
    }
    if (sourceDoc.doc_type === 'purchase_order' && ['delivery_note', 'invoice'].includes(targetType)) {
      sourceDoc.status = 'completed';
    }
    if (sourceDoc.doc_type === 'delivery_note' && targetType === 'invoice') {
      sourceDoc.status = 'invoiced';
    }

    // For credit notes, mark original as credited
    if (targetType === 'credit_note') {
      sourceDoc.status = 'credited';
      sourceDoc.credit_note_id = newDoc.id;
      sourceDoc.credit_note_number = newDoc.number;
    }

    // Update stock based on Order-to-Cash rules
    if (defaults.should_decrease_stock) {
      newDoc.items.forEach(item => {
        const product = products.find(p => p.id == item.product_id);
        if (product) {
          product.stock_qty -= item.qty;
          console.log(`📦 Stock decreased for ${product.sku}: ${product.stock_qty} (${targetType} from ${sourceDoc.doc_type})`);
        }
      });
    } else {
      console.log(`✋ No stock change for ${targetType} (source: ${sourceDoc.doc_type})`);
    }

    documents.push(newDoc);
    console.log('✅ Document converted:', sourceDoc.number, '→', newDoc.number, `(${sourceDoc.doc_type} → ${targetType})`);
    res.json(newDoc);
  } catch (error) {
    console.error('Error converting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Duplicate document
app.post('/api/documents/:id/duplicate', (req, res) => {
  console.log('POST /api/documents/:id/duplicate', req.params.id);
  const sourceDoc = documents.find(d => d.id == req.params.id);
  if (!sourceDoc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  try {
    const newDoc = {
      id: docCounter++,
      number: `${getDocPrefix(sourceDoc.doc_type)}-${String(docCounter).padStart(6, '0')}`,
      date: new Date().toISOString(),
      doc_type: sourceDoc.doc_type,
      customer_id: sourceDoc.customer_id,
      customer_name: sourceDoc.customer_name,
      items: sourceDoc.items.map(item => ({ ...item })),
      payments: [],
      global_discount_type: sourceDoc.global_discount_type,
      global_discount_value: sourceDoc.global_discount_value,
      currency: sourceDoc.currency || "EUR",
      total: sourceDoc.total,
      paid_total: 0,
      status: 'draft'
    };

    documents.push(newDoc);
    console.log('Document duplicated:', newDoc.number);
    res.json(newDoc);
  } catch (error) {
    console.error('Error duplicating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add payment to document
app.post('/api/documents/:id/pay', (req, res) => {
  console.log('POST /api/documents/:id/pay', req.params.id, req.body);
  const doc = documents.find(d => d.id == req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  try {
    const payment = {
      method: req.body.method || 'cash',
      amount: parseFloat(req.body.amount) || 0,
      date: new Date().toISOString(),
      reference: req.body.reference || null
    };

    if (!doc.payments) doc.payments = [];
    doc.payments.push(payment);

    doc.paid_total = doc.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Update status based on payment
    if (doc.paid_total >= doc.total) {
      doc.status = 'paid';
    } else if (doc.paid_total > 0) {
      doc.status = 'partially_paid';
    }

    console.log('Payment added to document:', doc.number, payment);
    res.json(doc);
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Company Settings endpoints
app.get('/api/company-settings', (req, res) => {
  console.log('GET /api/company-settings');
  res.json(companySettings);
});

app.put('/api/company-settings', (req, res) => {
  console.log('PUT /api/company-settings', req.body);
  companySettings = { ...companySettings, ...req.body };
  saveSettings(); // Save to disk
  res.json(companySettings);
});

// Peppyrus/Peppol Settings endpoints
app.get('/api/peppyrus-settings', (req, res) => {
  console.log('GET /api/peppyrus-settings');
  res.json(peppyrusSettings);
});

app.put('/api/peppyrus-settings', (req, res) => {
  console.log('PUT /api/peppyrus-settings', req.body);
  peppyrusSettings = { ...peppyrusSettings, ...req.body };
  saveSettings(); // Save to disk
  res.json(peppyrusSettings);
});

app.post('/api/peppol/test-connection', async (req, res) => {
  console.log('POST /api/peppol/test-connection');
  try {
    // Use credentials from body if provided, otherwise use stored settings
    const apiKey = req.body.api_key || peppyrusSettings.api_key;
    const testMode = req.body.test_mode !== undefined ? req.body.test_mode : peppyrusSettings.test_mode;

    // Peppyrus only needs API Key (no secret required!)
    const result = await peppyrusService.testConnection(apiKey, testMode);
    res.json(result);
  } catch (error) {
    console.error('Peppol connection test failed:', error.message);
    res.json({
      success: false,
      message: error.message || 'Connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Shopify Settings endpoints
app.get('/api/shopify-settings', (req, res) => {
  console.log('GET /api/shopify-settings');
  res.json(shopifySettings);
});

app.put('/api/shopify-settings', (req, res) => {
  console.log('PUT /api/shopify-settings', req.body);

  // Map store_domain to shop_url for backward compatibility
  if (req.body.store_domain && !req.body.shop_url) {
    req.body.shop_url = req.body.store_domain;
  }

  shopifySettings = { ...shopifySettings, ...req.body };
  saveSettings(); // Save to disk
  res.json(shopifySettings);
});

app.post('/api/shopify/test-connection', async (req, res) => {
  console.log('POST /api/shopify/test-connection');

  if (!shopifySettings.shop_url || !shopifySettings.access_token) {
    return res.json({
      success: false,
      message: 'Shop URL et Access Token sont requis',
      shop_name: null
    });
  }

  try {
    // Make a simple API call to test credentials
    const hostname = shopifySettings.shop_url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    const finalHostname = hostname.includes('.myshopify.com') ? hostname : hostname + '.myshopify.com';

    const options = {
      hostname: finalHostname,
      port: 443,
      path: '/admin/api/2024-10/shop.json',
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': shopifySettings.access_token,
        'Content-Type': 'application/json'
      }
    };

    const testRequest = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            res.json({
              success: true,
              message: 'Connexion Shopify réussie',
              shop_name: parsed.shop?.name || finalHostname
            });
          } catch (e) {
            res.json({
              success: false,
              message: 'Réponse invalide de Shopify',
              shop_name: null
            });
          }
        } else {
          res.json({
            success: false,
            message: `Erreur ${response.statusCode}: ${data}`,
            shop_name: null
          });
        }
      });
    });

    testRequest.on('error', (error) => {
      res.json({
        success: false,
        message: `Erreur de connexion: ${error.message}`,
        shop_name: null
      });
    });

    testRequest.setTimeout(10000, () => {
      testRequest.destroy();
      res.json({
        success: false,
        message: 'Timeout - Shopify ne répond pas',
        shop_name: null
      });
    });

    testRequest.end();
  } catch (error) {
    res.json({
      success: false,
      message: `Erreur: ${error.message}`,
      shop_name: null
    });
  }
});

function createSyncLog(syncType, status, details = {}, counts = {}) {
  return {
    id: syncLogs.length + 1,
    created_at: new Date().toISOString(),
    sync_type: syncType,
    status,
    items_processed: counts.items_processed ?? 0,
    items_succeeded: counts.items_succeeded ?? 0,
    items_failed: counts.items_failed ?? 0,
    details
  };
}

app.post('/api/shopify/sync', (req, res) => {
  console.log('POST /api/shopify/sync');
  const log = createSyncLog('full', 'success', { message: 'Synchronisation manuelle démarrée' });
  syncLogs.unshift(log);
  shopifySettings.last_sync = new Date().toISOString();
  saveSettings(); // Save sync timestamp
  res.json(log);
});

app.post('/api/shopify/sync/products', async (req, res) => {
  console.log('POST /api/shopify/sync/products');
  console.log('Shopify settings:', { shop_url: shopifySettings.shop_url, has_token: !!shopifySettings.access_token });

  // Check if Shopify credentials are configured
  if (!shopifySettings.shop_url || !shopifySettings.access_token) {
    const log = createSyncLog('products', 'failed', { message: 'Configuration Shopify manquante (Shop URL et Access Token requis)' }, {
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0
    });
    syncLogs.unshift(log);
    return res.status(400).json({ error: 'Shopify credentials not configured', log });
  }

  try {
    console.log('🔄 Starting Shopify product and collection import...');

    // Step 1: Fetch and import collections (custom collections + smart collections)
    console.log('📁 Fetching Shopify collections...');
    const collections = await fetchShopifyCollections(shopifySettings.shop_url, shopifySettings.access_token);
    console.log(`Found ${collections.length} collections`);

    // Create category mapping from Shopify collections
    const categoryMapping = new Map();
    let nextCategoryId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;

    for (const collection of collections) {
      // Check if category already exists by title
      let existingCategory = categories.find(c =>
        c.name_fr.toLowerCase() === collection.title.toLowerCase() ||
        c.name_nl.toLowerCase() === collection.title.toLowerCase()
      );

      if (!existingCategory) {
        // Create new category
        const newCategory = {
          id: nextCategoryId++,
          name_fr: collection.title,
          name_nl: collection.title,
          product_count: 0,
          image_url: collection.image?.src || null,
          shopify_id: collection.id,
          description: collection.body_html || null
        };
        categories.push(newCategory);
        existingCategory = newCategory;
        console.log(`✅ Created category: ${collection.title}`);
      }

      categoryMapping.set(collection.id.toString(), existingCategory.id);
    }

    // Step 2: Fetch products from Shopify Admin API (with pagination)
    const shopifyProducts = await fetchShopifyProducts(shopifySettings.shop_url, shopifySettings.access_token);
    console.log(`📦 Processing ${shopifyProducts.length} products from Shopify...`);

    let nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const imported = [];
    const skipped = [];
    const existingSkus = new Set(products.map(p => p.sku));

    for (const shopifyProduct of shopifyProducts) {
      // Determine category based on product_type or first collection
      let category_id = 1; // Default

      // Try to map by product_type first
      if (shopifyProduct.product_type) {
        const matchingCategory = categories.find(c =>
          c.name_fr.toLowerCase() === shopifyProduct.product_type.toLowerCase() ||
          c.name_nl.toLowerCase() === shopifyProduct.product_type.toLowerCase()
        );
        if (matchingCategory) {
          category_id = matchingCategory.id;
        } else {
          // Create new category for this product type
          const newCat = {
            id: nextCategoryId++,
            name_fr: shopifyProduct.product_type,
            name_nl: shopifyProduct.product_type,
            product_count: 0,
            image_url: null
          };
          categories.push(newCat);
          category_id = newCat.id;
          console.log(`✅ Created category from product_type: ${shopifyProduct.product_type}`);
        }
      }

      // Process each variant
      for (const variant of shopifyProduct.variants) {
        const sku = variant.sku || `SHOPIFY-${variant.id}`;

        // Skip if already exists
        if (existingSkus.has(sku)) {
          skipped.push(sku);
          continue;
        }

        // Build variant title (size, color, etc.)
        const variantTitle = variant.title !== 'Default Title' ? ` - ${variant.title}` : '';

        // Extract dimensions from variant options or title
        const dimensions = {
          width: null,
          height: null,
          depth: null,
          weight: variant.weight || null,
          weight_unit: variant.weight_unit || 'kg'
        };

        // Try to extract dimensions from options (e.g., "30x30", "60x60")
        const sizeMatch = (shopifyProduct.title + variantTitle).match(/(\d+)x(\d+)(?:x(\d+))?/);
        if (sizeMatch) {
          dimensions.width = parseFloat(sizeMatch[1]);
          dimensions.height = parseFloat(sizeMatch[2]);
          if (sizeMatch[3]) dimensions.depth = parseFloat(sizeMatch[3]);
        }

        const newProduct = {
          id: nextId++,
          category_id: category_id,
          sku: sku,
          name_fr: shopifyProduct.title + variantTitle,
          name_nl: shopifyProduct.title + variantTitle,
          description: shopifyProduct.body_html || null,
          price_retail: parseFloat(variant.price) || 0,
          price_compare: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          stock_qty: variant.inventory_quantity || 0,
          unit: 'pièce',
          vat_rate: 21,
          image_url: variant.image_id ?
            (shopifyProduct.images.find(img => img.id === variant.image_id)?.src || shopifyProduct.image?.src) :
            shopifyProduct.image?.src || null,
          barcode: variant.barcode || null,
          gtin: variant.barcode || null,
          // Additional Shopify data
          shopify_product_id: shopifyProduct.id,
          shopify_variant_id: variant.id,
          vendor: shopifyProduct.vendor || null,
          tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
          product_type: shopifyProduct.product_type || null,
          // Dimensions
          width: dimensions.width,
          height: dimensions.height,
          depth: dimensions.depth,
          weight: dimensions.weight,
          weight_unit: dimensions.weight_unit,
          // Options (size, color, material, etc.)
          option1_name: shopifyProduct.options[0]?.name || null,
          option1_value: variant.option1 || null,
          option2_name: shopifyProduct.options[1]?.name || null,
          option2_value: variant.option2 || null,
          option3_name: shopifyProduct.options[2]?.name || null,
          option3_value: variant.option3 || null,
          // Status
          status: shopifyProduct.status || 'active',
          requires_shipping: variant.requires_shipping !== false
        };

        imported.push(newProduct);
        existingSkus.add(sku);
      }
    }

    products.push(...imported);
    recalcCategoryCounts();

    console.log(`✅ Import complete:`);
    console.log(`   - ${collections.length} collections → ${categories.length} categories`);
    console.log(`   - ${imported.length} new products added`);
    console.log(`   - ${skipped.length} products skipped (already exist)`);

    const log = createSyncLog('products', 'success', {
      message: `Import Shopify terminé: ${collections.length} collections, ${imported.length} produits importés (${skipped.length} déjà présents)`
    }, {
      items_processed: shopifyProducts.length,
      items_succeeded: imported.length,
      items_failed: 0
    });
    syncLogs.unshift(log);
    shopifySettings.last_product_sync = new Date().toISOString();
    saveSettings(); // Save sync timestamp
    res.json(log);

  } catch (error) {
    console.error('Shopify import error:', error);
    const log = createSyncLog('products', 'failed', { message: `Erreur: ${error.message}` }, {
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0
    });
    syncLogs.unshift(log);
    res.status(500).json({ error: error.message, log });
  }
});

// Helper function to fetch products from Shopify Admin API with pagination
function fetchShopifyProducts(storeDomain, accessToken) {
  return new Promise(async (resolve, reject) => {
    try {
      // Clean up the domain - remove protocol and trailing slashes
      let hostname = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Remove any path components (e.g., /admin)
      hostname = hostname.split('/')[0];

      // If domain doesn't end with .myshopify.com, add it
      if (!hostname.includes('.myshopify.com')) {
        hostname = hostname + '.myshopify.com';
      }

      console.log(`Starting to fetch ALL products from ${hostname}...`);

      let allProducts = [];
      let pageCount = 0;
      let nextPageUrl = '/admin/api/2024-10/products.json?limit=250';

      // Fetch all pages using Link header pagination
      while (nextPageUrl) {
        pageCount++;
        console.log(`Fetching page ${pageCount}...`);

        const result = await fetchShopifyPage(hostname, accessToken, nextPageUrl);
        allProducts = allProducts.concat(result.products);
        nextPageUrl = result.nextPageUrl;

        console.log(`Page ${pageCount}: ${result.products.length} products (Total so far: ${allProducts.length})`);

        // Safety limit to prevent infinite loops
        if (pageCount > 100) {
          console.log('Safety limit reached (100 pages)');
          break;
        }
      }

      console.log(`✅ Finished fetching all products. Total: ${allProducts.length}`);
      resolve(allProducts);

    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to fetch collections from Shopify
function fetchShopifyCollections(storeDomain, accessToken) {
  return new Promise(async (resolve, reject) => {
    try {
      let hostname = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
      if (!hostname.includes('.myshopify.com')) {
        hostname = hostname + '.myshopify.com';
      }

      console.log(`Fetching collections from ${hostname}...`);

      // Fetch both custom collections and smart collections
      const customCollections = [];
      const smartCollections = [];

      // Fetch custom collections
      let nextUrl = '/admin/api/2024-10/custom_collections.json?limit=250';
      while (nextUrl) {
        const result = await fetchShopifyPage(hostname, accessToken, nextUrl);
        customCollections.push(...(result.custom_collections || []));
        nextUrl = result.nextPageUrl;
      }

      // Fetch smart collections
      nextUrl = '/admin/api/2024-10/smart_collections.json?limit=250';
      while (nextUrl) {
        const result = await fetchShopifyPage(hostname, accessToken, nextUrl);
        smartCollections.push(...(result.smart_collections || []));
        nextUrl = result.nextPageUrl;
      }

      const allCollections = [...customCollections, ...smartCollections];
      console.log(`✅ Found ${customCollections.length} custom + ${smartCollections.length} smart = ${allCollections.length} total collections`);
      resolve(allCollections);

    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to fetch a single page
function fetchShopifyPage(hostname, accessToken, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'User-Agent': 'POS-System/1.0'
      }
    };

    const req = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);

            // Parse Link header for pagination
            let nextPageUrl = null;
            const linkHeader = response.headers['link'];
            if (linkHeader) {
              // Link header format: <url>; rel="next"
              const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
              if (matches && matches[1]) {
                // Extract just the path from the full URL
                const url = new URL(matches[1]);
                nextPageUrl = url.pathname + url.search;
              }
            }

            resolve({
              products: parsed.products || [],
              custom_collections: parsed.custom_collections || [],
              smart_collections: parsed.smart_collections || [],
              nextPageUrl: nextPageUrl
            });
          } catch (e) {
            console.error('Failed to parse Shopify response:', e);
            reject(new Error('Invalid JSON response from Shopify'));
          }
        } else {
          console.error('Shopify API error response:', data);
          reject(new Error(`Shopify API error: ${response.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Network error calling Shopify:', error);
      reject(new Error(`Network error: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout - Shopify did not respond within 30 seconds'));
    });

    req.end();
  });
}

app.post('/api/shopify/sync/stock', (req, res) => {
  console.log('POST /api/shopify/sync/stock');
  const items_synced = 0;
  const log = createSyncLog('stock', 'success', { message: 'Sync stock démarré' }, {
    items_processed: items_synced,
    items_succeeded: items_synced,
    items_failed: 0
  });
  syncLogs.unshift(log);
  shopifySettings.last_stock_sync = new Date().toISOString();
  res.json({ items_synced });
});

app.post('/api/shopify/sync/orders', (req, res) => {
  console.log('POST /api/shopify/sync/orders');
  const log = createSyncLog('orders', 'success', { message: 'Import commandes démarré' }, {
    items_processed: 0,
    items_succeeded: 0,
    items_failed: 0
  });
  syncLogs.unshift(log);
  shopifySettings.last_order_sync = new Date().toISOString();
  res.json(log);
});

app.get('/api/shopify/sync-logs', (req, res) => {
  console.log('GET /api/shopify/sync-logs');
  res.json(syncLogs);
});

app.get('/api/shopify/unmapped-products', (req, res) => {
  console.log('GET /api/shopify/unmapped-products');
  res.json(unmappedProducts);
});

app.post('/api/shopify/map-product', (req, res) => {
  console.log('POST /api/shopify/map-product', req.body);
  const { shopify_product_id, local_product_id } = req.body;
  // Remove from unmapped
  unmappedProducts = unmappedProducts.filter(p => p.id !== shopify_product_id);
  res.json({ success: true, message: 'Produit mappé avec succès' });
});

// Helper functions
function getDocPrefix(docType) {
  const prefixes = {
    'quote': 'DEV',
    'invoice': 'FAC',
    'purchase_order': 'BC',
    'delivery_note': 'BL',
    'credit_note': 'AV'
  };
  return prefixes[docType] || 'DOC';
}

function calculateTotal(items, discountType, discountValue) {
  let subtotal = 0;

  items.forEach(item => {
    let lineTotal = item.qty * item.unit_price;
    if (item.discount_type === 'percent') {
      lineTotal -= lineTotal * (item.discount_value / 100);
    } else if (item.discount_type === 'fixed') {
      lineTotal -= item.discount_value;
    }
    subtotal += lineTotal;
  });

  if (discountType === 'percent') {
    subtotal -= subtotal * (discountValue / 100);
  } else if (discountType === 'fixed') {
    subtotal -= discountValue;
  }

  const vat = subtotal * 0.21;
  return subtotal + vat;
}

// Calculate VAT breakdown by rate
function calculateVATBreakdown(items) {
  const vatGroups = {};

  items.forEach(item => {
    const vatRate = item.vat_rate || 21;
    const lineTotal = (item.qty || item.qty_credited) * item.unit_price_excl_vat;
    const vatAmount = lineTotal * (vatRate / 100);

    if (!vatGroups[vatRate]) {
      vatGroups[vatRate] = {
        rate: vatRate,
        category: item.vat_category || 'S',
        base: 0,
        vat: 0,
        total: 0
      };
    }

    vatGroups[vatRate].base += lineTotal;
    vatGroups[vatRate].vat += vatAmount;
    vatGroups[vatRate].total += lineTotal + vatAmount;
  });

  return Object.values(vatGroups);
}

// Get credited quantities for invoice lines
function getCreditedQuantities(invoiceId) {
  const credited = {};
  creditNotes
    .filter(cn => cn.invoice_id === invoiceId)
    .forEach(cn => {
      cn.lines.forEach(line => {
        if (line.invoice_line_id) {
          credited[line.invoice_line_id] = (credited[line.invoice_line_id] || 0) + line.qty_credited;
        }
      });
    });
  return credited;
}

// ========================================
// RETURNS & CREDIT NOTES API ENDPOINTS
// ========================================

// Get all returns
app.get('/api/returns', (req, res) => {
  console.log('GET /api/returns');
  const { customer_id, status } = req.query;

  let filtered = returns;
  if (customer_id) {
    filtered = filtered.filter(r => r.customer_id == customer_id);
  }
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }

  res.json(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// Get return by ID
app.get('/api/returns/:id', (req, res) => {
  console.log('GET /api/returns/:id', req.params.id);
  const ret = returns.find(r => r.id == req.params.id);
  if (!ret) {
    return res.status(404).json({ error: 'Return not found' });
  }
  res.json(ret);
});

// Create new return
app.post('/api/returns', (req, res) => {
  console.log('POST /api/returns');
  const { invoice_id, reason, warehouse_id, lines } = req.body;

  // Validate invoice exists
  const invoice = documents.find(d => d.id == invoice_id && d.doc_type === 'invoice');
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Check invoice status
  if (invoice.status === 'draft') {
    return res.status(400).json({ error: 'Cannot create return for draft invoice' });
  }

  // Get already credited quantities
  const creditedQties = getCreditedQuantities(invoice_id);

  // Validate return lines
  const returnLines = [];
  for (const line of lines) {
    const invoiceLine = invoice.items.find(item => item.id === line.invoice_line_id);
    if (!invoiceLine) {
      return res.status(400).json({ error: `Invoice line ${line.invoice_line_id} not found` });
    }

    const alreadyCredited = creditedQties[line.invoice_line_id] || 0;
    const maxReturn = invoiceLine.qty - alreadyCredited;

    if (line.qty_returned <= 0 || line.qty_returned > maxReturn) {
      return res.status(400).json({
        error: `Invalid quantity for line ${line.invoice_line_id}. Max returnable: ${maxReturn}`
      });
    }

    returnLines.push({
      id: returnLines.length + 1,
      invoice_line_id: line.invoice_line_id,
      sku: invoiceLine.sku,
      description: invoiceLine.description,
      qty_returned: line.qty_returned,
      unit_price_excl_vat: invoiceLine.unit_price,
      vat_rate: invoiceLine.vat_rate || 21,
      vat_category: 'S',
      condition: line.condition || 'new',
      restocking_fee_excl_vat: line.restocking_fee_excl_vat || 0,
      restock: line.restock !== false
    });
  }

  const newReturn = {
    id: returnCounter++,
    number: `RET-${new Date().getFullYear()}-${String(returnCounter).padStart(6, '0')}`,
    invoice_id,
    invoice_number: invoice.number,
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    created_at: new Date().toISOString(),
    status: 'draft',
    reason: reason || '',
    warehouse_id: warehouse_id || 1,
    lines: returnLines,
    credit_note_id: null
  };

  returns.push(newReturn);
  res.json(newReturn);
});

// Validate return (approve & prepare for credit note generation)
app.put('/api/returns/:id/validate', (req, res) => {
  console.log('PUT /api/returns/:id/validate', req.params.id);
  const ret = returns.find(r => r.id == req.params.id);

  if (!ret) {
    return res.status(404).json({ error: 'Return not found' });
  }

  if (ret.status !== 'draft') {
    return res.status(400).json({ error: 'Return already validated' });
  }

  // Update stock for items marked for restocking
  ret.lines.forEach(line => {
    if (line.restock) {
      const product = products.find(p => p.sku === line.sku);
      if (product) {
        product.stock_qty = (product.stock_qty || 0) + line.qty_returned;
      }
    }
  });

  ret.status = 'validated';
  ret.validated_at = new Date().toISOString();

  res.json(ret);
});

// Generate credit note from return
app.post('/api/returns/:id/generate-credit-note', (req, res) => {
  console.log('POST /api/returns/:id/generate-credit-note', req.params.id);
  const ret = returns.find(r => r.id == req.params.id);

  if (!ret) {
    return res.status(404).json({ error: 'Return not found' });
  }

  if (ret.status !== 'validated') {
    return res.status(400).json({ error: 'Return must be validated first' });
  }

  if (ret.credit_note_id) {
    return res.status(400).json({ error: 'Credit note already generated for this return' });
  }

  const invoice = documents.find(d => d.id === ret.invoice_id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Build credit note lines
  const creditLines = ret.lines.map((line, idx) => {
    const lineTotal = (line.qty_returned * line.unit_price_excl_vat).toFixed(2);
    return {
      id: idx + 1,
      invoice_line_id: line.invoice_line_id,
      sku: line.sku,
      description: line.description,
      qty_credited: line.qty_returned,
      uom: 'pièce',
      unit_price_excl_vat: line.unit_price_excl_vat,
      vat_rate: line.vat_rate,
      vat_category: line.vat_category,
      line_total_excl_vat: parseFloat(lineTotal)
    };
  });

  // Add restocking fees if any
  ret.lines.forEach((line, idx) => {
    if (line.restocking_fee_excl_vat > 0) {
      creditLines.push({
        id: creditLines.length + 1,
        invoice_line_id: null,
        sku: 'RESTOCK-FEE',
        description: `Frais de restockage - ${line.description}`,
        qty_credited: 1,
        uom: 'pièce',
        unit_price_excl_vat: -line.restocking_fee_excl_vat,
        vat_rate: line.vat_rate,
        vat_category: line.vat_category,
        line_total_excl_vat: -line.restocking_fee_excl_vat
      });
    }
  });

  // Calculate totals
  const vatBreakdown = calculateVATBreakdown(creditLines);
  const totalExclVat = creditLines.reduce((sum, line) => sum + line.line_total_excl_vat, 0);
  const totalVat = vatBreakdown.reduce((sum, vat) => sum + vat.vat, 0);
  const totalInclVat = totalExclVat + totalVat;

  const creditNote = {
    id: creditNoteCounter++,
    number: `CN-${new Date().getFullYear()}-${String(creditNoteCounter).padStart(6, '0')}`,
    issue_date: new Date().toISOString(),
    invoice_id: ret.invoice_id,
    invoice_number: ret.invoice_number,
    return_id: ret.id,
    return_number: ret.number,
    customer_id: ret.customer_id,
    customer_name: ret.customer_name,
    currency: invoice.currency || 'EUR',
    status: 'issued',
    lines: creditLines,
    vat_breakdown: vatBreakdown,
    total_excl_vat: parseFloat(totalExclVat.toFixed(2)),
    total_vat: parseFloat(totalVat.toFixed(2)),
    total_incl_vat: parseFloat(totalInclVat.toFixed(2)),
    settlement_status: 'pending',
    settlement_method: null,
    settled_at: null,
    peppol_message_id: null,
    peppol_send_status: null,
    peppol_last_error: null
  };

  creditNotes.push(creditNote);

  // Link credit note to return
  ret.credit_note_id = creditNote.id;

  // Update invoice status if fully credited
  const creditedQties = getCreditedQuantities(invoice.id);
  const allFullyCredited = invoice.items.every(item => {
    const credited = creditedQties[item.id] || 0;
    return credited >= item.qty;
  });

  if (allFullyCredited) {
    invoice.status = 'credited';
  }

  res.json(creditNote);
});

// Get all credit notes
app.get('/api/credit-notes', (req, res) => {
  console.log('GET /api/credit-notes');
  const { customer_id, status } = req.query;

  let filtered = creditNotes;
  if (customer_id) {
    filtered = filtered.filter(cn => cn.customer_id == customer_id);
  }
  if (status) {
    filtered = filtered.filter(cn => cn.status === status);
  }

  res.json(filtered.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date)));
});

// Get credit note by ID
app.get('/api/credit-notes/:id', (req, res) => {
  console.log('GET /api/credit-notes/:id', req.params.id);
  const cn = creditNotes.find(c => c.id == req.params.id);
  if (!cn) {
    return res.status(404).json({ error: 'Credit note not found' });
  }
  res.json(cn);
});

// Settle credit note (refund or customer credit)
app.post('/api/credit-notes/:id/settle', (req, res) => {
  console.log('POST /api/credit-notes/:id/settle', req.params.id);
  const { settlement_method } = req.body; // 'cash', 'card', 'bank', 'customer_credit'

  const cn = creditNotes.find(c => c.id == req.params.id);
  if (!cn) {
    return res.status(404).json({ error: 'Credit note not found' });
  }

  if (cn.settlement_status !== 'pending') {
    return res.status(400).json({ error: 'Credit note already settled' });
  }

  if (settlement_method === 'customer_credit') {
    // Add to customer credit balance
    const customer = customers.find(c => c.id === cn.customer_id);
    if (customer) {
      customer.credit_balance = (customer.credit_balance || 0) + cn.total_incl_vat;
    }

    // Create ledger entry
    customerCreditLedger.push({
      id: creditLedgerCounter++,
      customer_id: cn.customer_id,
      type: 'credit',
      amount: cn.total_incl_vat,
      source: 'credit_note',
      source_id: cn.id,
      created_at: new Date().toISOString(),
      description: `Credit note ${cn.number}`
    });

    cn.settlement_status = 'settled';
    cn.settlement_method = 'customer_credit';
    cn.settled_at = new Date().toISOString();
  } else {
    // Create refund record
    const refund = {
      id: refundCounter++,
      credit_note_id: cn.id,
      method: settlement_method,
      amount: cn.total_incl_vat,
      provider_ref: null,
      created_at: new Date().toISOString(),
      status: settlement_method === 'cash' ? 'done' : 'pending'
    };

    refunds.push(refund);

    cn.settlement_status = settlement_method === 'cash' ? 'settled' : 'processing';
    cn.settlement_method = settlement_method;
    if (settlement_method === 'cash') {
      cn.settled_at = new Date().toISOString();
    }
  }

  res.json(cn);
});

// Get customer credit ledger
app.get('/api/customers/:id/credit-ledger', (req, res) => {
  console.log('GET /api/customers/:id/credit-ledger', req.params.id);
  const ledger = customerCreditLedger.filter(l => l.customer_id == req.params.id);
  res.json(ledger.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// Get invoice with return eligibility
app.get('/api/invoices/:id/returnable', (req, res) => {
  console.log('GET /api/invoices/:id/returnable', req.params.id);
  const invoice = documents.find(d => d.id == req.params.id && d.doc_type === 'invoice');

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const creditedQties = getCreditedQuantities(invoice.id);

  const returnableItems = invoice.items.map(item => {
    const credited = creditedQties[item.id] || 0;
    const returnable = item.qty - credited;

    return {
      ...item,
      qty_credited: credited,
      qty_returnable: Math.max(0, returnable)
    };
  });

  res.json({
    ...invoice,
    items: returnableItems,
    has_returnable_items: returnableItems.some(item => item.qty_returnable > 0)
  });
});

// Export credit note as Peppol UBL XML
app.get('/api/credit-notes/:id/peppol-ubl', (req, res) => {
  console.log('GET /api/credit-notes/:id/peppol-ubl', req.params.id);
  const cn = creditNotes.find(c => c.id == req.params.id);

  if (!cn) {
    return res.status(404).json({ error: 'Credit note not found' });
  }

  const invoice = documents.find(d => d.id === cn.invoice_id);
  if (!invoice) {
    return res.status(404).json({ error: 'Related invoice not found' });
  }

  const customer = customers.find(c => c.id === cn.customer_id);

  // Generate Peppol BIS Billing 3.0 UBL CreditNote XML
  const xml = generatePeppolCreditNoteUBL(cn, invoice, customer, companySettings);

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Generate Peppol UBL CreditNote XML (simplified)
function generatePeppolCreditNoteUBL(creditNote, invoice, customer, company) {
  const formatDate = (date) => new Date(date).toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
            xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
            xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${creditNote.number}</cbc:ID>
  <cbc:IssueDate>${formatDate(creditNote.issue_date)}</cbc:IssueDate>
  <cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>
  <cbc:DocumentCurrencyCode>${creditNote.currency}</cbc:DocumentCurrencyCode>
  
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${invoice.number}</cbc:ID>
      <cbc:IssueDate>${formatDate(invoice.date)}</cbc:IssueDate>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0196">${company.vat_number}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${company.legal_name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${company.street_name}</cbc:StreetName>
        <cbc:BuildingNumber>${company.building_number}</cbc:BuildingNumber>
        <cbc:CityName>${company.city}</cbc:CityName>
        <cbc:PostalZone>${company.postal_code}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${company.country}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${company.vat_number}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${company.legal_name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${customer.peppol_id ? `<cbc:EndpointID schemeID="0196">${customer.peppol_id}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${customer.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${customer.address}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>BE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${customer.vat_number ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${customer.vat_number}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${customer.name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  ${creditNote.vat_breakdown.map(vat => `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${creditNote.currency}">${vat.vat.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${creditNote.currency}">${vat.base.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${creditNote.currency}">${vat.vat.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${vat.category}</cbc:ID>
        <cbc:Percent>${vat.rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`).join('')}
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${creditNote.currency}">${creditNote.total_excl_vat.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${creditNote.currency}">${creditNote.total_excl_vat.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${creditNote.currency}">${creditNote.total_incl_vat.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${creditNote.currency}">${creditNote.total_incl_vat.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  ${creditNote.lines.map((line, idx) => `
  <cac:CreditNoteLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:CreditedQuantity unitCode="${line.uom === 'pièce' ? 'C62' : 'MTQ'}">${line.qty_credited}</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="${creditNote.currency}">${line.line_total_excl_vat.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${line.description}</cbc:Description>
      <cbc:Name>${line.description}</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>${line.sku}</cbc:ID>
      </cac:SellersItemIdentification>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${line.vat_category}</cbc:ID>
        <cbc:Percent>${line.vat_rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${creditNote.currency}">${line.unit_price_excl_vat.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>`).join('')}
</CreditNote>`;
}

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`✅ Backend API démarré sur http://localhost:${PORT}`);
  console.log('🚀 ========================================');
  console.log('');
  console.log('📊 Données disponibles:');
  console.log(`   - ${categories.length} catégories`);
  console.log(`   - ${products.length} produits`);
  console.log(`   - ${customers.length} clients`);
  console.log('');
  console.log('🔗 Endpoints disponibles:');
  console.log('   GET  /api/categories');
  console.log('   GET  /api/products');
  console.log('   GET  /api/customers');
  console.log('   POST /api/customers');
  console.log('   PUT  /api/customers/:id');
  console.log('   POST /api/sales');
  console.log('   POST /api/documents');
  console.log('   GET  /api/company-settings');
  console.log('   PUT  /api/company-settings');
  console.log('   GET  /api/peppyrus-settings');
  console.log('   PUT  /api/peppyrus-settings');
  console.log('   GET  /api/shopify-settings');
  console.log('   PUT  /api/shopify-settings');
  console.log('');
});
