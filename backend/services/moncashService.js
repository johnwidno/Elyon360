const fetch = global.fetch;

class MonCashService {
    constructor() {
        this.clientId = (process.env.MONCASH_CLIENT_ID || '').trim();
        this.secretKey = (process.env.MONCASH_SECRET_KEY || '').trim();
        this.mode = (process.env.MONCASH_MODE || 'sandbox').trim(); // 'sandbox' or 'live'
        this.baseUrl = this.mode === 'live'
            ? 'https://moncashbutton.digicelgroup.com/Api'
            : 'https://sandbox.moncashbutton.digicelgroup.com/Api';
        this.redirectUrl = this.mode === 'live'
            ? 'https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect?token='
            : 'https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect?token=';
    }

    async getAccessToken() {
        console.log(`[MonCash] Requesting access token from: ${this.baseUrl}/oauth/token`);

        const auth = Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64');
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'read,write');

        const response = await fetch(`${this.baseUrl}/oauth/token`, {
            method: 'POST',
            body: params.toString(),
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MonCash] Token request failed. Status: ${response.status}`);
            console.error(`[MonCash] Response Body: ${errorText}`);

            if (errorText.includes('"maintenanceMode":true')) {
                throw new Error("Le service MonCash est actuellement en maintenance. Veuillez réessayer plus tard.");
            }

            throw new Error(`MonCash Token Error: ${errorText}`);
        }

        const data = await response.json();
        console.log(`[MonCash] ✅ Access token obtained successfully`);
        return data.access_token;
    }

    async createPayment(orderId, amount) {
        // SIMULATION FOR DEVELOPMENT (If the account is blocked or we want to test quickly)
        const isSimMode = this.mode === 'sandbox' && process.env.NODE_ENV === 'development';

        try {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.baseUrl}/v1/CreatePayment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    orderId: orderId.toString()
                })
            });

            if (!response.ok) {
                const error = await response.text();
                // If it's blocked, and we are in dev, fallback to simulation
                if (isSimMode && (error.includes('blocked') || error.includes('BAD_REQUEST'))) {
                    console.warn(`[MonCash] Account blocked. Falling back to SIMULATION for Order: ${orderId}`);
                    return {
                        token: "SIM_TOKEN_" + orderId,
                        redirectUrl: `${process.env.FRONTEND_URL}/payment-success?transactionId=SIM_TX_${orderId}&orderId=${orderId}`
                    };
                }
                throw new Error(`MonCash CreatePayment Error: ${error}`);
            }

            const data = await response.json();
            const paymentToken = data.payment_token.token;
            return {
                token: paymentToken,
                redirectUrl: `${this.redirectUrl}${paymentToken}`
            };
        } catch (error) {
            if (isSimMode) {
                console.warn(`[MonCash SIMULATION] API Error, falling back to simulation: ${error.message}`);
                return {
                    token: "SIM_TOKEN_" + orderId,
                    redirectUrl: `${process.env.FRONTEND_URL}/payment-success?transactionId=SIM_TX_${orderId}&orderId=${orderId}`
                };
            }
            console.error("MonCash Service Error:", error);
            throw error;
        }
    }

    async getPaymentDetails(transactionId) {
        const isSimMode = this.mode === 'sandbox' && process.env.NODE_ENV === 'development';

        // Explicit simulation prefix
        if (isSimMode && (transactionId.toString().startsWith('SIM_TX_') || transactionId === 'test_tx')) {
            const orderId = transactionId.toString().startsWith('SIM_TX_') ? transactionId.replace('SIM_TX_', '') : "TEST_ORDER";
            console.log(`[MonCash SIMULATION] Simulating successful payment details for Tx: ${transactionId}`);
            return {
                payment: { reference: orderId, status: 'successful', message: 'successful' },
                status: 'successful'
            };
        }

        try {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.baseUrl}/v1/RetrieveTransactionPayment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ transactionId: transactionId.toString() })
            });

            if (!response.ok) {
                const error = await response.text();
                if (isSimMode && (error.includes('blocked') || error.includes('BAD_REQUEST'))) {
                    console.warn(`[MonCash] Account blocked during verification. Simulating success for Tx: ${transactionId}`);
                    // Try to guess orderId from transactionId or metadata if possible, 
                    // otherwise the controller will try fallback to manual verify by orderId.
                    return {
                        payment: {
                            status: 'successful',
                            message: 'successful',
                            transactionId: transactionId || "SIM-" + Date.now(),
                            transaction_id: transactionId || "SIM-" + Date.now()
                        },
                        status: 'successful'
                    };
                }
                throw new Error(`MonCash RetrieveTransaction Error: ${error}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (isSimMode) {
                console.warn(`[MonCash SIMULATION] Verification API Error, falling back to simulation: ${error.message}`);
                return {
                    payment: { status: 'successful', message: 'successful' },
                    status: 'successful'
                };
            }
            console.error("MonCash Retrieve Error:", error);
            throw error;
        }
    }

    async getPaymentByOrderId(orderId) {
        // SIMULATION FOR DEVELOPMENT
        if (this.mode === 'sandbox' && process.env.NODE_ENV === 'development') {
            console.log(`[MonCash SIMULATION] Simulating successful payment check for Order: ${orderId}`);
            return {
                payment: {
                    reference: orderId,
                    status: 'successful',
                    message: 'successful',
                    transactionId: "SIM-ORD-" + orderId,
                    transaction_id: "SIM-ORD-" + orderId
                },
                status: 'successful'
            };
        }

        try {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.baseUrl}/v1/RetrieveOrderPayment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ orderId: orderId.toString() })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`MonCash RetrieveOrderPayment Error: ${error}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("MonCash RetrieveOrder Error:", error);
            throw error;
        }
    }
}

module.exports = new MonCashService();
