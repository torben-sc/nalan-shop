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

async function captureOrder(orderID) {
    const accessToken = await getAccessToken();
    const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!captureResponse.ok) {
        const errorText = await captureResponse.text();
        console.error('Capture Order Response:', errorText);
        throw new Error('Failed to capture PayPal order');
    }

    const captureData = await captureResponse.json();
    return captureData;
}

exports.handler = async function (event) {
    try {
        const { httpMethod, body } = event;
        const parsedBody = JSON.parse(body || '{}');

        if (httpMethod === 'POST' && parsedBody.action === 'capture') {
            const { orderID } = parsedBody;
            if (!orderID) {
                throw new Error('Order ID is required for capturing');
            }
            const captureResult = await captureOrder(orderID);
            return {
                statusCode: 200,
                body: JSON.stringify(captureResult),
            };
        }

        if (httpMethod === 'POST' && parsedBody.action === 'create') {
            const { cartItems } = parsedBody;
            if (!Array.isArray(cartItems)) {
                throw new Error('Invalid cart data format. Expected an array under cartItems.');
            }
            let totalAmount = 0;

            const items = cartItems.map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) {
                    throw new Error(`Product with ID ${item.id} not found`);
                }

                totalAmount += product.price * item.quantity;

                return {
                    name: product.name,
                    sku: product.id,
                    unit_amount: {
                        currency_code: 'EUR',
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
                                currency_code: 'EUR',
                                value: totalAmount.toFixed(2),
                                breakdown: {
                                    item_total: {
                                        currency_code: 'EUR',
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
        }

        throw new Error('Unsupported action or method');
    } catch (error) {
        console.error('Error handling request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};