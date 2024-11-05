exports.handler = async (event, context) => {
    return {
      statusCode: 200,
      body: JSON.stringify({ link: process.env.PAYPAL_LINK })
    };
  };