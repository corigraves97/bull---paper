const axios = require('axios');
require ('dotenv').config();


const apiKey = [ process.env.ALPHAVANTAGE_KEY3, 
  // overview
  ];

const url = `https://www.alphavantage.co/query`;


 
async function overView(tickers) {
    // for postman testing, use the following URL
    // http://localhost:3000/api/overview?tickers=AAPL
    // include this in the body of the request
    // { "tickers": "AAPL" }
  const apiKeyOverview = apiKey[3];

  if (!apiKeyOverview) {
    throw new Error('Missing Alpha Vantage overview API key (ALPHAVANTAGE_KEY3).');
  }

  const symbol = (tickers && tickers.trim()) || 'AAPL';
  // apple is default if no symbol provided
  


  const response = await axios.get(url, {
    params: {
      function: 'OVERVIEW',
      tickers: symbol,
      apikey: apiKeyOverview,
    }
  });

  if (!response.data || response.data.error ) {
    throw new Error('Failed to fetch overview data');
  }

  return response.data;
}

module.exports = { overView }
// this function fetches the overview data for a given ticker symbol from Alpha Vantage API
// it uses the first API key in the apiKey array
// to save this to a model in the future
// you would need to create a Mongoose schema and model for the overview data
// then you could save the fetched data to the database
// for now, it just returns the fetched data
// here is an example of a mongoose schema for the overview data
// const overviewSchema = new Schema({
//   symbol: String,
//   assetType: String,
//   name: String,
//   description: String,
//   exchange: String,
//   currency: String,
//   country: String,
//   sector: String,
//   industry: String,
//   address: String,
//   fiscalYearEnd: String,
//   latestQuarter: String,
//   marketCapitalization: Number,
//   EBITDA: Number,
//   PERatio: Number,
//   PEGRatio: Number,
//   bookValue: Number,
//   dividendPerShare: Number,
//   dividendYield: Number,
//   EPS: Number,
//   revenuePerShareTTM: Number,
//   profitMargin: Number,
//   operatingMarginTTM: Number,
//   returnOnAssetsTTM: Number,
//   returnOnEquityTTM: Number,
//   revenueTTM: Number,
//   grossProfitTTM: Number,
//   dilutedEPSTTM: Number,
//   quarterlyEarningsGrowthYOY: Number,
//   quarterlyRevenueGrowthYOY: Number,
//   analystTargetPrice: Number,
//   trailingPE: Number,
//   forwardPE: Number,
//   priceToSalesRatioTTM: Number,
//   priceToBookRatio: Number,
//   EVToRevenue: Number,
//   EVToEBITDA: Number,
//   beta: Number,
//   week52High: Number,
//   week52Low: Number,
//   day50MovingAverage: Number,
//   day200MovingAverage: Number,
//   sharesOutstanding: Number,
//   sharesFloat: Number,
//   sharesShort: Number,
//   sharesShortPriorMonth: Number,
//   shortRatio: Number,
//   shortPercentOutstanding: Number,
//   shortPercentFloat: Number,
//   percentInsiders: Number,
//   percentInstitutions: Number,
//   forwardAnnualDividendRate: Number,
//   forwardAnnualDividendYield: Number,
//   payoutRatio: Number,
//   dividendDate: String,
//   exDividendDate: String,
//   lastSplitFactor: String,
//   lastSplitDate: String,
// });  
// to save the fetched data to the database
// you would do something like this
// const Overview = mongoose.model('Overview', overviewSchema);
// const overviewData = new Overview(response.data);
