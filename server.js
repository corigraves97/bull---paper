const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors')
const authRouter = require('./USER/controllers/auth');
const usersRouter = require('./USER/controllers/users');
const apiNewsRouter = require('./apiClient/routes/news');


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
app.use('/api', apiNewsRouter);


async function fetchAlphaVantage(url) {
    const response = await fetch(url)
    if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
}





app.listen(3000, () => {
  console.log('The express app is ready!');
});
