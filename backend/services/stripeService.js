const Stripe = require('stripe');

class StripeService {
    constructor() {
        this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    }

    async createCheckoutSession(orderId, amount, churchName, currency = 'usd') {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: {
                        name: `Abonnement Ekklesia 360 - ${churchName}`,
                        description: 'Inscription et activation de votre plateforme de gestion d\'église',
                    },
                    unit_amount: Math.round(amount * 100), // Stripe uses cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
            metadata: {
                orderId: orderId,
                churchName: churchName
            }
        });

        return {
            sessionId: session.id,
            redirectUrl: session.url
        };
    }

    async verifySession(sessionId) {
        try {
            console.log(`[Stripe Service] Retrieving session: ${sessionId}`);
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            return {
                paid: session.payment_status === 'paid',
                orderId: session.metadata?.orderId,
                amount: session.amount_total / 100,
                customerEmail: session.customer_details?.email
            };
        } catch (error) {
            console.error(`[Stripe Service] Error retrieving session ${sessionId}:`, error);
            throw error;
        }
    }
}

module.exports = new StripeService();
