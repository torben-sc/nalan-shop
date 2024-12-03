// netlify/functions/get-paypal-link.js

exports.handler = async (event, context) => {
  const productId = event.queryStringParameters.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Produkt-ID fehlt.' }),
    };
  }

  const paypalLinkKey = `PAYPAL_LINK_PRODUCT${productId.toUpperCase()}`;
  const paypalLink = process.env[paypalLinkKey];

  if (!paypalLink) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Optional für spätere API-Anfragen
      },
      body: JSON.stringify({ error: 'PayPal-Link nicht gefunden.' }),
    };
  }

  // HTTP 302 Redirect zum PayPal-Link
  return {
    statusCode: 302,
    headers: {
      "Location": paypalLink,
      "Access-Control-Allow-Origin": "*", // Optional, nicht notwendig für Redirects
    },
  };
};
