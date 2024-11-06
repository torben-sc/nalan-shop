exports.handler = async (event, context) => {
    try {
        const { cartItems } = JSON.parse(event.body);
        if (!cartItems || !Array.isArray(cartItems)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid cart items.' }),
            };
        }

        let total = 0;
        cartItems.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                total += product.price * item.quantity;
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ total: total.toFixed(2) }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred while calculating the cart total.' }),
        };
    }
};
