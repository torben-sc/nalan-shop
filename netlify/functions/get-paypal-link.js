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
          statusCode: 500,
          headers: {
              "Access-Control-Allow-Origin": "*", // Diese Zeile ermöglicht Cross-Origin-Anfragen
          },
          body: JSON.stringify({ error: 'PayPal-Link nicht gefunden. Bitte überprüfen Sie die Umgebungsvariablen.' }),
      };
  }

  return {
      statusCode: 302, // Status-Code für Weiterleitung
      headers: {
          "Location": paypalLink, // Weiterleitungsziel
          "Access-Control-Allow-Origin": "*", // Cross-Origin-Anfragen ermöglichen
      },
  };
};
