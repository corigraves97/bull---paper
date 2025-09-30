const router = require('express').Router();
const newsAlpha = require('../eaches/news');

router.get('/', (req, res) => {
  res.send('News API is working');
});

router.get('/news', async (req, res) => {
  const { tickers } = req.query;
  console.log('Received request for /news with tickers:', tickers);
  try {
    const quote = await newsAlpha.newsAlpha(tickers);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


