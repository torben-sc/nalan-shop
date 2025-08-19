exports.handler = async function () {
    const { PAYPAL_CLIENT_ID } = process.env;

    if (!PAYPAL_CLIENT_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Client ID not configured' }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ clientId: PAYPAL_CLIENT_ID }),
    };
};
