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
}

module.exports = new PeppyrusService();
