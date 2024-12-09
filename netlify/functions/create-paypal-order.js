const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    try {
        // Überprüfen, ob der Request POST ist
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            };
        }

        // Den Request-Body parsen
        const { cartItems } = JSON.parse(event.body);

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid cartItems data' }),
            };
        }

        // Laden der products.json
        const productsFilePath = path.resolve(__dirname, 'products.json');
        const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));

        // Bestellung erstellen
        const orderItems = [];
        let totalPrice = 0;

        for (const cartItem of cartItems) {
            const product = productsData.find(p => p.id === cartItem.id);

            if (!product) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: `Product with ID ${cartItem.id} not found` }),
                };
            }

            if (cartItem.quantity > product.stock) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: `Insufficient stock for product ${product.name}`,
                    }),
                };
            }

            // Artikel zur Bestellung hinzufügen
            const itemTotalPrice = product.price * cartItem.quantity;
            orderItems.push({
                id: product.id,
                name: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                total: itemTotalPrice,
            });

            totalPrice += itemTotalPrice;
        }

        // Rückgabe der Bestellung
        const order = {
            items: orderItems,
            totalAmount: totalPrice.toFixed(2),
        };

        return {
            statusCode: 200,
            body: JSON.stringify(order),
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
