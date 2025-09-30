const mongoose = require('mongoose');
const sharesAvailable = require('../apiClient/eaches/shares.js');
const overView = require('../apiClient/eaches/overView.js');
const newsAlpha = require('../apiClient/eaches/news.js');

const { Schema } = mongoose;


const tickerSentimentSchema = new Schema(
  {
    ticker: String,
    relevanceScore: Number,
    sentimentScore: Number,
    sentimentLabel: String,
  },
  { _id: false }
);

const newsArticleSchema = new Schema(
  {
    title: String,
    url: String,
    publishedAt: Date,
    authors: [String],
    summary: String,
    bannerImage: String,
    source: String,
    topics: [
      new Schema(
        {
          topic: String,
          relevanceScore: Number,
        },
        { _id: false }
      ),
    ],
    overallSentimentScore: Number,
    overallSentimentLabel: String,
    tickerSentiment: [tickerSentimentSchema],
  },
  { _id: false }
);

const sharesDetailSchema = new Schema(
  {
    asOf: Date,
    basic: Number,
    diluted: Number,
  },
  { _id: false }
);

const overviewSchema = new Schema(
  {
    name: String,
    description: String,
    exchange: String,
    currency: String,
    country: String,
    sector: String,
    industry: String,
    fiscalYearEnd: String,
    latestQuarter: String,
    marketCap: Number,
    peRatio: Number,
    pegRatio: Number,
    bookValue: Number,
    dividendPerShare: Number,
    dividendYield: Number,
    eps: Number,
    profitMargin: Number,
    operatingMargin: Number,
    returnOnAssets: Number,
    returnOnEquity: Number,
    revenueTTM: Number,
    grossProfitTTM: Number,
    analystTargetPrice: Number,
    fiftyTwoWeekHigh: Number,
    fiftyTwoWeekLow: Number,
    fiftyDayMovingAverage: Number,
    twoHundredDayMovingAverage: Number,
    sharesOutstanding: Number,
    percentInsiders: Number,
    percentInstitutions: Number,
    beta: Number,
  },
  { _id: false }
);
//api
const marketSnapshotSchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true },
    priceRange: Number,
    shortFloat: Number,
    avgVolume: Number,
    avgTrueRange: Number,
    typeIndustry: String,
    marketCap: Number,
    newsSentiment: Number,
    newsSentimentLabel: String,
    newsArticles: [newsArticleSchema],
    sharesOutstanding: Number,
    institutionalOwnership: Number,
    sharesDetail: [sharesDetailSchema],
    overview: [overviewSchema],
    fetchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

async function fetchMarketSnapshot(symbol, { keywords } = {}) {
  const uppercaseSymbol = symbol.toUpperCase();
  const searchTerm = keywords || uppercaseSymbol;

  const [searchData, sharesData, newsData, overviewData] = await Promise.all([
   sharesAvailable(uppercaseSymbol),
  ]);

  return buildMarketSnapshot(uppercaseSymbol, {
    searchData,
    sharesData,
    newsData,
    overviewData,
  });
}
///all user 
const journalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    symbol: { type: String, required: true, uppercase: true, index: true },
    side: { type: String, enum: ['long', 'short'], required: true },
    timeOfDay: { type: Date, required: true, index: true },
    shareSize: { type: Number, required: true },
    entry: { type: Number, required: true },
    exit: { type: Number, required: true },
    volume: {
      type: String,
      enum: [
        '1m - 5m',
        '10m - 20m',
        '30m - 40m',
        '50m - 70m',
        '80m - 100m',
        '120m - 150m',
        '160m - 180m',
        '200+m',
      ],
      required: true,
    },
    fees: { type: Number, default: 0 },
    executedDay: { type: Date, required: true, index: true },
    meta: {
      strategyTag: String,
    },
    notes: { type: String },
    marketSnapshot: marketSnapshotSchema,
  },
  { timestamps: true }
);

journalSchema.index({ userId: 1, symbol: 1 }, { unique: true });
journalSchema.index({ userId: 1, timeOfDay: -1 });

journalSchema.statics.fetchMarketSnapshot = fetchMarketSnapshot;

journalSchema.statics.createWithMarketData = async function createWithMarketData(
  payload,
  options = {}
) {
  const { symbol, keywords, ...rest } = payload;

  if (!symbol) {
    throw new Error('createWithMarketData requires a `symbol` field.');
  }

  const snapshot = await fetchMarketSnapshot(symbol, { keywords });

  return this.create(
    {
      ...rest,
      symbol: symbol.toUpperCase(),
      marketSnapshot: snapshot,
    },
    options
  );
};

journalSchema.methods.refreshMarketSnapshot = async function refreshMarketSnapshot(
  { keywords, save = true } = {}
) {
  const snapshot = await fetchMarketSnapshot(this.symbol, { keywords });
  this.marketSnapshot = snapshot;

  if (save) {
    await this.save();
  }

  return this;
};

// exporting these files separately in case we want to use them individually later
// when we do, we can import them like this:
// const { Position, MarketSnapshot } = require('./journal');
// const { SharesDetail } = require('./journal');
// const { Overview } = require('./journal');
// const { NewsArticle } = require('./journal');
// const { TickerSentiment } = require('./journal');

// then we can use them like this:
// const position = new Position({ ... });
// const snapshot = new MarketSnapshot({ ... });
// const sharesDetail = new SharesDetail({ ... });
// const overview = new Overview({ ... });
// const newsArticle = new NewsArticle({ ... });
// const tickerSentiment = new TickerSentiment({ ... });

// this way we can keep our code organized and modular
// and we can easily import only the models we need in different parts of our application
// without having to import the entire journal.js file
// which can be large and unwieldy
// especially as we add more models and functionality to it over time
// so this approach helps keep our codebase clean and maintainable
//
const Journal = mongoose.model("Journal", journalSchema);
const MarketSnapshot = mongoose.model("MarketSnapshot", marketSnapshotSchema);
const SharesDetail = mongoose.model("SharesDetail", sharesDetailSchema);
const Overview = mongoose.model("Overview", overviewSchema);
const NewsArticle = mongoose.model("NewsArticle", newsArticleSchema);
const TickerSentiment = mongoose.model("TickerSentiment", tickerSentimentSchema);

module.exports = {
  Journal,
  MarketSnapshot,
  SharesDetail,
  Overview,
  NewsArticle,
  TickerSentiment,
};
