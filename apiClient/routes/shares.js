

const router = require('express').Router();
const sharesAvailable = require('../eaches/shares.js');

router.get('/', (req, res) => {
  res.send('Shares API is working');
});

router.get('/shares', async (req, res) => {
  const { tickers } = req.query;
  console.log('Received request for /shares with tickers:', tickers);
  try {
    const quote = await sharesAvailable.sharesAvailable(tickers);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


