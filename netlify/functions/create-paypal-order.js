const fetch = require('node-fetch');
const products = require('./products.json'); // Importiere die Produkte

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Sandbox-API von PayPal
const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env; // PayPal-Umgebungsvariablen

async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
}

exports.handler = async function (event) {
    try {
        const cartData = JSON.parse(event.body); // Erwartet [{ id: "1", quantity: 2 }, ...]
        let totalAmount = 0;

        const items = cartData.map((item) => {
            const product = products.find((p) => p.id === item.id);
            if (!product) {
                throw new Error(`Product with ID ${item.id} not found`);
            }

            totalAmount += product.price * item.quantity;

            return {
                name: product.name,
                sku: product.id,
                unit_amount: {
                    currency_code: 'USD',
                    value: product.price.toFixed(2),
                },
                quantity: item.quantity.toString(),
            };
        });

        const accessToken = await getAccessToken();

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
                            currency_code: 'USD',
                            value: totalAmount.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: totalAmount.toFixed(2),
                                },
                            },
                        },
                        items,
                    },
                ],
            }),
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to create PayPal order');
        }

        const orderData = await orderResponse.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ orderID: orderData.id }),
        };
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
