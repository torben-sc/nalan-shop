import { Client, Environment, OrdersController } from "@paypal/paypal-server-sdk";
import fs from "fs";
import path from "path";

// PayPal-Client initialisieren
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    environment: Environment.Sandbox, // Produktionsumgebung: Environment.Live
});

const ordersController = new OrdersController(client);

const getProducts = () => {
    const productsFilePath = path.resolve(__dirname, "products.json");
    return JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));
};

const calculateTotal = (cartItems, products) => {
    let total = 0;

    const items = cartItems.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);

        if (!product) {
            throw new Error(`Product with ID ${cartItem.id} not found.`);
        }
        if (cartItem.quantity > product.stock) {
            throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const itemTotal = product.price * cartItem.quantity;
        total += itemTotal;

        return {
            name: product.name,
            unit_amount: { currency_code: "EUR", value: product.price.toFixed(2) },
            quantity: cartItem.quantity,
        };
    });

    return { total: total.toFixed(2), items };
};

export async function handler(event) {
    try {
        if (event.httpMethod !== "POST") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        const { cartItems } = JSON.parse(event.body);
        const products = getProducts();

        const { total, items } = calculateTotal(cartItems, products);

        const orderRequest = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "EUR",
                        value: total,
                        breakdown: { item_total: { currency_code: "EUR", value: total } },
                    },
                    items,
                },
            ],
        };

        const { body: order } = await ordersController.ordersCreate({
            body: orderRequest,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ orderID: order.id }),
        };
    } catch (error) {
        console.error("Error creating PayPal order:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}
