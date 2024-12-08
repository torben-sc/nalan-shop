const products = require('./products.json'); // Die Datei liegt im gleichen Ordner wie die Funktion

exports.handler = async (event, context) => {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify(products),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching products' }),
        };
    }
};
