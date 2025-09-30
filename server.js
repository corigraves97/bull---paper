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
const overView = require('./apiClient/routes/overView');
const sharesRouter = require('./apiClient/routes/shares');
// const journalRouter = require('./JOURNAL/controllers/journal')
const journalRouter = require('./JOURNAL/controllers/journalList');


if(!global.fetch) {
    global.fetch = (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args))
}



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
app.use('/api', overView);
app.use('/api', sharesRouter);

app.use('/journal', journalRouter)


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
