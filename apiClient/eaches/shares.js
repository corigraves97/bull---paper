const axios = require('axios');
require ('dotenv').config();
const BASE_URL = 'https://www.alphavantage.co/query';


const apiKey = [
    process.env.ALPHAVANTAGE_KEY0,
    process.env.ALPHAVANTAGE_KEY1,
    process.env.ALPHAVANTAGE_KEY2,
    process.env.ALPHAVANTAGE_KEY3,
]

// postman testing URL
// http://localhost:3000/api/shares?tickers=AAPL


async function sharesAvailable(tickers) {

  const apiKeyShares = apiKey[1];
    // shares available is hard coded to use the 2nd key in the array
  if (!apiKeyShares) {
    throw new Error('Missing Alpha Vantage shares API key (ALPHAVANTAGE_KEY1).');
  }

  const symbol = (tickers && tickers.trim()) || 'AAPL';
  // apple is default if no symbol provided

  const response = await axios.get(BASE_URL, {
    params: {
      function: 'SHARES_OUTSTANDING',
      Symbol: symbol,
      apikey: apiKeyShares,
    }
  });

  if (!response.data || response.data.error) {
    throw new Error('Failed to fetch news sentiment data');
  }

  return response.data;
}

module.exports = {
    sharesAvailable
};      