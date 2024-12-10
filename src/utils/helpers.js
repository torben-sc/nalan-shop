// Funktion zum Abrufen von Produkten aus dem Backend
export async function fetchProducts() {
    try {
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) {
            throw new Error(`Error loading products: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Funktion zur Erstellung einer PayPal-Bestellung
export async function createPayPalOrder(cartItems) {
    try {
        const response = await fetch('/.netlify/functions/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems }),
        });

        if (!response.ok) {
            throw new Error('Failed to create PayPal order');
        }

        const data = await response.json();
        return data.orderID;
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        throw error;
    }
}

// Funktion zur Analyse der URL und Extrahierung von Parametern
export function getQueryParams() {
    const params = {};
    const queryString = window.location.search;
    if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
    }
    return params;
}
