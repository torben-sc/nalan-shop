// netlify/functions/get-paypal-link.js

exports.handler = async (event, context) => {
  // Hole die Produkt-ID aus den URL-Parametern
  const productId = event.queryStringParameters.productId;

  if (!productId) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Produkt-ID fehlt.' }),
      };
  }

  // Hole die PayPal-Link-Umgebungsvariable basierend auf der Produkt-ID
  const paypalLinkKey = `PAYPAL_LINK_PRODUCT${productId.toUpperCase()}`;
  const paypalLink = process.env[paypalLinkKey];

  if (!paypalLink) {
      return {
          statusCode: 404,
          body: JSON.stringify({ error: 'PayPal-Link für dieses Produkt nicht gefunden.' }),
      };
  }

  return {
      statusCode: 200,
      body: JSON.stringify({ link: paypalLink }),
  };
};
