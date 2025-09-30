const router = require('express').Router();
const overView = require('../eaches/overView.js');

router.get('/', (req, res) => {
  res.send('Overview API is working');
});

router.get('/overview', async (req, res) => {
  const { tickers } = req.query;
  console.log('Received request for /overview with tickers:', tickers);
  try {
    const quote = await overView.overView(tickers);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
});

module.exports = router;

