const fetch = require('node-fetch');
const products = require('./products.json'); // Importiere die Produkte
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; 
const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env; 

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

async function captureOrder(orderID, cartItems) {
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
    console.log('Capture Result:', JSON.stringify(captureData, null, 2));

    // Update products.json
    updateProducts(cartItems);

    // Push to GitHub
    const productsPath = path.join(__dirname, 'products.json');
    await pushToGitHub(productsPath);

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

            let shippingCost = 10;
            if (totalAmount >= 100) {
                shippingCost = 0;
            }

            totalAmount += shippingCost;

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
                                        value: (totalAmount - shippingCost).toFixed(2),
                                    },
                                    shipping: {
                                        currency_code: 'EUR',
                                        value: shippingCost.toFixed(2),
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

function updateProducts(cartItems) {
    const productsPath = path.join(__dirname, 'products.json'); // Pfad zur Datei
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    cartItems.forEach((item) => {
        const productIndex = products.findIndex((p) => p.id === item.id);
        if (productIndex !== -1) {
            const product = products[productIndex];
            if (product.stock >= item.quantity) {
                product.stock -= item.quantity; // Verringere den Stock um die verkaufte Menge
            } else {
                console.warn(`Insufficient stock for product ID ${item.id}.`);
            }
        } else {
            console.warn(`Product with ID ${item.id} not found.`);
        }
    });

    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8'); // Speichere die aktualisierte Datei
    console.log('Products stock updated locally.');
}


async function pushToGitHub(branch = 'main') {
    const filePath = './netlify/functions/products.json'; // Relativer Pfad zur Datei
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileBase64 = Buffer.from(fileContent).toString('base64');

    const owner = 'torben-sc';
    const repo = 'nalan-shop';
    const fileName = 'netlify/functions/products.json'; // Pfad innerhalb des Repos
    const apiToken = process.env.GITHUB_TOKEN; // GitHub Personal Access Token

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

    // Schritt 1: Abrufen des aktuellen SHA-Wertes der Datei
    const currentFileResponse = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!currentFileResponse.ok) {
        throw new Error(`Failed to fetch current file: ${currentFileResponse.statusText}`);
    }

    const currentFile = await currentFileResponse.json();
    const sha = currentFile.sha; // Aktuellen SHA-Wert der Datei abrufen

    // Schritt 2: Datei aktualisieren
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: `Updated ${fileName} after order capture`,
            content: fileBase64,
            branch: branch,
            sha: sha,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to push file: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('File pushed to GitHub:', responseData);
}

module.exports = pushToGitHub;
