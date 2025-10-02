const axios = require('axios');
require ('dotenv').config();
const url = `https://www.alphavantage.co/query`;

const apiKey = [
    process.env.ALPHAVANTAGE_KEY0,
    process.env.ALPHAVANTAGE_KEY1,
    process.env.ALPHAVANTAGE_KEY2,
    process.env.ALPHAVANTAGE_KEY3,
];
 
async function overView(tickers) {

    const apiKeyOver = apiKey[3]

      if (!apiKeyOver) {
        throw new Error('Missing Alpha Vantage overview API key (ALPHAVANTAGE_KEY3).');
      }

      const symbol = (tickers && tickers.trim()) || 'AAPL';
      // apple is default if no symbol provided
      // postman testing URL
      // http://localhost:3000/api/overview?tickers=AAPL
      // tickers because that's what the front end sends
      // 
      


      const response = await axios.get(url, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: apiKeyOver,
        }
      });

      if (!response.data || response.data.error ) {
        throw new Error('Failed to fetch overview data');
      }

      return response.data;
}

module.exports = { overView }
