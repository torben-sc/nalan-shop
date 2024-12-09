import fetch from 'node-fetch';
import fs from 'fs';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const getAccessToken = async () => {
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get PayPal access token: ${error.error_description}`);
    }

    const data = await response.json();
    return data.access_token;
};

const getProducts = () => {
    try {
        // Direkt den relativen Pfad nutzen
        const productsData = fs.readFileSync('./products.json', 'utf-8');
        return JSON.parse(productsData);
    } catch (error) {
        console.error('Error reading products.json:', error);
        throw new Error('Failed to load products data.');
    }
};

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { cartItems } = JSON.parse(event.body);

        if (!cartItems || !Array.isArray(cartItems)) {
            return { statusCode: 400, body: 'Invalid cart items' };
        }

        const products = getProducts();

        const purchaseUnits = cartItems.map(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) throw new Error(`Product with ID ${item.id} not found`);
            if (item.quantity > product.stock) throw new Error(`Not enough stock for product ${product.name}`);

            return {
                name: product.name,
                unit_amount: { currency_code: 'EUR', value: product.price.toFixed(2) },
                quantity: item.quantity.toString(),
            };
        });

        const totalAmount = purchaseUnits.reduce((sum, item) => {
            return sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity, 10);
        }, 0).toFixed(2);

        const accessToken = await getAccessToken();

        const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'EUR',
                            value: totalAmount,
                            breakdown: {
                                item_total: { currency_code: 'EUR', value: totalAmount },
                            },
                        },
                        items: purchaseUnits,
                    },
                ],
            }),
        });

        if (!orderResponse.ok) {
            const error = await orderResponse.json();
            throw new Error(`Failed to create PayPal order: ${error.message}`);
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
            body: JSON.stringify({ error: error.message }),
        };
    }
}
