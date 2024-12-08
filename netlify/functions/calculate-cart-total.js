exports.handler = async (event, context) => {
    try {
        const { cartItems } = JSON.parse(event.body);
        console.log('Received body:', event.body);

        if (!cartItems || !Array.isArray(cartItems)) {
            console.error('Invalid cart items:', cartItems);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid cart items.' }),
            };
        }

        console.log('Products:', products); // Ensure products is loaded
        let total = 0;
        cartItems.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                total += product.price * item.quantity;
            } else {
                console.error('Product not found for ID:', item.id);
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ total: total.toFixed(2) }),
        };
    } catch (error) {
        console.error('Error in calculate-cart-total:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred while calculating the cart total.' }),
        };
    }
};
