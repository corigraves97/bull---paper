const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors')
const authRouter = require('./USER/controllers/auth');
const usersRouter = require('./USER/controllers/users');

if(!global.fetch) {
    global.fetch = (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args))
}

const apiKey = [
    process.env.ALPHAVANTAGE_KEY0,
    process.env.ALPHAVANTAGE_KEY1,
    process.env.ALPHAVANTAGE_KEY2,
    process.env.ALPHAVANTAGE_KEY3,
]

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.json());
app.use(logger('dev'));
app.use(cors())
app.use('/users', usersRouter);  
app.use('/auth', authRouter);


async function fetchAlphaVantage(url) {
    const response = await fetch(url)
    if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
}

app.get('/search', async (req, res) => {
    try{
        const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=tesco&apikey=${apiKey[0]}`
        const data = await fetchAlphaVantage(url)
        res.json(data)
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
})

app.get('/shares', async (req, res) => {
  try {
    const url = `https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol=MSFT&apikey=${apiKey[1]}`;
    const data = await fetchAlphaVantage(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/news', async (req, res) => {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=${apiKey[2]}`;
    const data = await fetchAlphaVantage(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/overview', async (req, res) => {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${apiKey[3]}`;
    const data = await fetchAlphaVantage(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/', (req, res) => {
  res.send('Working');
})


app.listen(3000, () => {
  console.log('The express app is ready!');
});
