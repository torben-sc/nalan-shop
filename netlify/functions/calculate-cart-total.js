const fs = require('fs');
const path = require('path');

// Netlify Function Handler
exports.handler = async function (event, context) {
    try {
        // Prüfen, ob die Anfrage ein POST-Request ist
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
            };
        }

        // Body der Anfrage parsen
        const cart = JSON.parse(event.body);

        if (!Array.isArray(cart)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid cart format. Expected an array.' }),
            };
        }

        // Produkte aus der products.json laden
        const productsPath = path.resolve(__dirname, 'products.json');
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);

        // Preisberechnung
        let totalAmount = 0;
        let invalidItems = [];

        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);

            if (product) {
                // Überprüfen, ob genügend Bestand vorhanden ist
                if (cartItem.quantity > product.stock) {
                    invalidItems.push({
                        id: cartItem.id,
                        error: 'Insufficient stock',
                    });
                } else {
                    totalAmount += product.price * cartItem.quantity;
                }
            } else {
                invalidItems.push({
                    id: cartItem.id,
                    error: 'Product not found',
                });
            }
        });

        // Rückgabe mit Gesamtpreis und eventuellen Fehlern
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalAmount: totalAmount.toFixed(2), // Gesamtpreis als String mit zwei Nachkommastellen
                invalidItems, // Liste ungültiger Artikel
            }),
        };
    } catch (error) {
        console.error('Error calculating cart total:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
