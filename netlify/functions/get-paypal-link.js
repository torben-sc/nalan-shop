// netlify/functions/get-paypal-link.js
exports.handler = async (event, context) => {
    // Hole die PayPal-Link Umgebungsvariable
    const paypalLink = process.env.PAYPAL_LINK;
  
    if (!paypalLink) { //hier eventuell weitere Sicherheitsmaßnahmen hinzufügen, bspw.: JSON Web Token oder URL Filter
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'PayPal-Link nicht gefunden. Bitte überprüfen Sie die Umgebungsvariablen.' }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ link: paypalLink }),
    };
  };
  