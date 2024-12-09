import { OrdersController, Client, Environment } from '@paypal/paypal-server-sdk';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Ermitteln des absoluten Pfads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PayPal-Client initialisieren
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    environment: Environment.Sandbox,
});

// Instanz des Orders Controllers erstellen
const ordersController = new OrdersController(client);

// Produkte laden
const getProducts = () => {
    try {
        const productsFilePath = path.join(__dirname, 'products.json');
        const productsData = fs.readFileSync(productsFilePath, 'utf-8');
        return JSON.parse(productsData);
    } catch (error) {
        console.error('Error reading products.json:', error);
        throw new Error('Failed to load products data.');
    }
};

// Bestellung erstellen
const createOrder = async (cartItems) => {
    const products = getProducts();

    // Purchase Units erstellen
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

    // Bestellung erstellen
    const orderRequest = {
        body: {
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
        },
        prefer: 'return=minimal',
    };

    try {
        const { body } = await ordersController.ordersCreate(orderRequest);
        return JSON.parse(body);
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        throw new Error(error.message);
    }
};

// Lambda-Handler
export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { cartItems } = JSON.parse(event.body);

        if (!cartItems || !Array.isArray(cartItems)) {
            return { statusCode: 400, body: 'Invalid cart items' };
        }

        const order = await createOrder(cartItems);

        return {
            statusCode: 200,
            body: JSON.stringify({ orderID: order.id }),
        };
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}
