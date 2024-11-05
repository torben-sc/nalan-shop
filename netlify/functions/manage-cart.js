// netlify/functions/manage-cart.js

const carts = {}; // In-memory storage für den Warenkorb (in einer echten Anwendung in einer Datenbank speichern)

exports.handler = async (event, context) => {
    const { userId, action, productId, quantity } = JSON.parse(event.body);

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User ID is required' }),
        };
    }

    // Falls kein Warenkorb für diesen Benutzer existiert, erstelle einen neuen
    if (!carts[userId]) {
        carts[userId] = [];
    }

    let cart = carts[userId];

    switch (action) {
        case 'add':
            const existingProduct = cart.find(item => item.id === productId);
            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                cart.push({ id: productId, quantity });
            }
            break;
        
        case 'remove':
            carts[userId] = cart.filter(item => item.id !== productId);
            break;

        case 'update':
            const productToUpdate = cart.find(item => item.id === productId);
            if (productToUpdate) {
                productToUpdate.quantity = quantity;
            }
            break;

        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid action' }),
            };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ cart }),
    };
};
