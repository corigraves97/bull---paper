const axios = require('axios');
require ('dotenv').config();
const BASE_URL = 'https://www.alphavantage.co/query';


const apiKey = [
    process.env.ALPHAVANTAGE_KEY0,
    process.env.ALPHAVANTAGE_KEY1,
    process.env.ALPHAVANTAGE_KEY2,
    process.env.ALPHAVANTAGE_KEY3,
]

async function newsAlpha(tickers) {
  const apiKeyNews = apiKey[2];

  if (!apiKeyNews) {
    throw new Error('Missing Alpha Vantage news API key (ALPHAVANTAGE_KEY2).');
  }

  const symbol = (tickers && tickers.trim()) || 'AAPL';

  const response = await axios.get(BASE_URL, {
    params: {
      function: 'NEWS_SENTIMENT',
      tickers: symbol,
      apikey: apiKeyNews,
    }
  });

  if (!response.data || response.data.error) {
    throw new Error('Failed to fetch news sentiment data');
  }

  return response.data;
}

module.exports = {
  newsAlpha
};      