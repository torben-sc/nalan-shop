const products = [
    {
        id: "1",
        name: "Handmade Bag",
        price: 100.00,
        images: ["images/test-bild.jpg", "images/logo.jpg"],
        description: "A beautifully crafted handmade bag.",
        stock: 10,
        category: "bags",
    },
    {
        id: "2",
        name: "Knitted Balaclava",
        price: 50.00,
        images: ["images/test-bild.jpg", "images/logo.jpg"],
        description: "Warm and cozy knitted balaclava.",
        stock: 5,
        category: "balaclavas",
    },
    {
        id: "3",
        name: "Woolen Hand Warmers",
        price: 45.00,
        images: ["images/test-bild.jpg", "images/logo.jpg"],
        description: "Handmade woolen hand warmers.",
        stock: 8,
        category: "hand warmers",
    },
    {
        id: "4",
        name: "Knitted Tie",
        price: 50.00,
        images: ["images/test-bild.jpg", "images/logo.jpg"],
        description: "A cute accessory keychain.",
        stock: 20,
        category: "other accessories",
    }
];

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
