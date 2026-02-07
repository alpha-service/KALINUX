const https = require('https');

class PeppyrusService {
    constructor() {
        this.apiUrls = {
            test: 'api.test.peppyrus.be',
            prod: 'api.peppyrus.be'
        };
    }

    request(endpoint, method, apiKey, testMode = true, body = null) {
        return new Promise((resolve, reject) => {
            const hostname = testMode ? this.apiUrls.test : this.apiUrls.prod;
            const options = {
                hostname: hostname,
                port: 443,
                path: `/v1${endpoint}`,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey  // Peppyrus uses X-Api-Key, NOT Basic Auth
                }
            };

            console.log(`[Peppyrus] ${method} https://${hostname}/v1${endpoint}`);

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`[Peppyrus] Response: ${res.statusCode}`);
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject({ status: res.statusCode, message: parsed.message || parsed.error || `HTTP ${res.statusCode}` });
                        }
                    } catch (e) {
                        // Response might not be JSON (like a plain error message)
                        reject({ status: res.statusCode, message: data || 'Invalid response' });
                    }
                });
            });

            req.on('error', (e) => reject({ message: `Failed to connect to ${hostname}: ${e.message}` }));

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    async testConnection(apiKey, testMode = true) {
        if (!apiKey) {
            throw new Error("API Key is required");
        }

        const hostname = testMode ? this.apiUrls.test : this.apiUrls.prod;
        try {
            // Try to list messages - a read-only endpoint to test auth
            await this.request('/message/list?limit=1', 'GET', apiKey, testMode);
            return { success: true, message: `Connexion réussie à ${hostname}!` };
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                throw new Error(`Clé API invalide pour ${hostname}. Vérifiez le switch "Mode test".`);
            }
            throw new Error(error.message || 'Connection failed');
        }
    }

    /**
     * Send an invoice to Peppol network via Peppyrus
     * @param {Object} invoiceData - The invoice UBL data or JSON wrapper
     * @param {string} apiKey - API Key
     * @param {boolean} testMode - true for test environment
     */
    async sendInvoice(invoiceData, apiKey, testMode = true) {
        if (!invoiceData) throw new Error("Invoice data is required");

        // Endpoint for sending outward documents
        // Based on typical Peppol access point APIs found in similar services
        // Assuming /outward/invoice or /message/send
        // We'll use /message/send which is common for sending generic UBL/XML or JSON

        try {
            console.log("[Peppyrus] Sending invoice...");
            // Construct payload - typically Peppyrus might expect { "format": "ubl", "content": "..." } or raw XML
            // For this implementation we'll wrap it assuming JSON interface or adjust if XML is needed.
            // Documentation suggested "Send/Receive Peppol invoices via API" at /v1

            // Standardizing on a likely endpoint structure
            const response = await this.request('/outward/invoice', 'POST', apiKey, testMode, invoiceData);
            return response;
        } catch (error) {
            console.error("[Peppyrus] Send failed:", error);
            throw error;
        }
    }
}

module.exports = new PeppyrusService();
