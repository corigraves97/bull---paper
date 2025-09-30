
const express = require('express');
const router = express.Router();

// require the shares controller
const sharesController = require('../../JOURNAL/controllers/shares.js');

router.get('/', sharesController.getRoot);
// postman testing URL
// http://localhost:3000/api/shares


// Route to fetch shares available data from external API
router.get('/shares', sharesController.getShares);
// postman testing URL
// http://localhost:3000/api/shares?tickers=AAPL

// Route to save a new shares detail entry
router.post('/shares', sharesController.postShares);


// Route to delete a shares detail entry by ID
router.delete('/shares/:id', sharesController.deleteShares);
// postman testing URL
// http://localhost:3000/api/shares/:id
// where :id is the ID of the shares detail entry to delete



// Route to get all saved shares details  
router.get('/savedShares', sharesController.getSavedShares);
// Route to delete a shares detail entry by ID
router.delete('/shares/:id', sharesController.deleteShares);


// Route to save both shares detail and a journal entry
router.post('/sharesAndJournal', sharesController.saveSharesDetailAndJournal);

// postman testing URL
// http://localhost:3000/api/showTicker/AAPL
// where AAPL is the ticker you want to show

module.exports = router;