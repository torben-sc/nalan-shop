const fetch = require('node-fetch');
const products = require('./products.json');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Für Sandbox-Umgebung

exports.handler = async function(event) {
    try {
        const { cartItems } = JSON.parse(event.body);

        if (!cartItems || !Array.isArray(cartItems)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid cart items.' }),
            };
        }

        // Berechne den Gesamtbetrag und erstelle die Artikel-Liste
        let total = 0;
        const items = cartItems.map(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                total += product.price * item.quantity;
                return {
                    name: product.name,
                    unit_amount: {
                        currency_code: 'EUR',
                        value: product.price.toFixed(2),
                    },
                    quantity: item.quantity.toString(),
                };
            }
        });

        // Schritt 1: Access Token abrufen
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Schritt 2: Bestellung erstellen
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'EUR',
                            value: total.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'EUR',
                                    value: total.toFixed(2),
                                },
                            },
                        },
                        items: items.filter(Boolean), // Entferne ungültige Artikel
                    },
                ],
            }),
        });

        const orderData = await orderResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ id: orderData.id, url: orderData.links.find(link => link.rel === 'approve').href }),
        };
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
