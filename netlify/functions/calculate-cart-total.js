const products = require('./products.json'); // Lade die Produkte aus der products.json

exports.handler = async function(event) {
    try {
        const cartData = JSON.parse(event.body); // Erwarte [{ id: "1", quantity: 2 }, ...]

        // Berechnung des Gesamtpreises
        let totalAmount = 0;
        cartData.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                totalAmount += product.price * item.quantity; // Multipliziere den Preis mit der Menge
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ totalAmount }),
        };
    } catch (error) {
        console.error('Error calculating total amount:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
