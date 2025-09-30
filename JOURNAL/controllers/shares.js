const sharesAvailable = require('../../apiClient/eaches/shares.js');
const { SharesDetail: sharesDetail,
    Journal: Journal,
    MarketSnapshot: marketSnapshotSchema,
    Overview: Overview,
    NewsArticle: NewsArticle,
    TickerSentiment: TickerSentiment,
 } = require('../models.js');



// Controller functions
// GET /api/shares
const getRoot = async (req, res) => {
    res.send('Shares API is working');
};

// GET /api/shares?tickers=AAPL
const getShares = async (req, res) => {
    const { tickers } = req.query;
    console.log('Received request for /shares with tickers:', tickers);
    try {
        const quote = await sharesAvailable.sharesAvailable(tickers);
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveSharesDetailAndJournal = async (req, res) => {
    // extract shares detail and market snapshot from request body
    const { sharesDetailData, marketSnapshotData } = req.body;

    // create new SharesDetail document
    const newShare = new sharesDetail(sharesDetailData);

    // create new Journal entry embedding the market snapshot
    const newJournalEntry = new Journal({
        ...sharesDetailData,
        marketSnapshot: marketSnapshotData
    });
/* trace where marketSnapshot comes from in your controller and explain the flow. From
the code in shares.js, the server never builds that snapshot itself; it simply pulls marketSnapshotData off req.body:

That means whatever client calls saveSharesDetailAndJournal (or postShares, which expects req.body.marketSnapshot)
 must already assemble the snapshot—typically by calling your external Alpha Vantage helpers (/api/overview, /api/news, /api/shares)  and bundling the results. The API just stores what it receives; it doesn’t hit Alpha Vantage or populate fields itself.
*/

    try {
        const savedShare = await newShare.save();
        const savedJournalEntry = await newJournalEntry.save();
        res.status(201).json({ savedShare, savedJournalEntry });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



// POST /api/shares
const postShares = async (req, res) => {
    console.log('Received POST /api/shares with body:', req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' });
    }

    const requiredFields = ['timeOfDay', 'shareSize', 'entry', 'exit', 'volume', 'executedDay'];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `Missing required field: ${field}` });
        }
    }
    // Create a new SharesDetail document
    const newShare = new sharesDetail(req.body); // create new SharesDetail document
    const marketSnapshot = req.body.marketSnapshot; // extract market snapshot data
    console.log('Market Snapshot:', marketSnapshot); // log market snapshot data
    // if marketSnapshot is provided in req.body, validate its fields
    if (marketSnapshot) {
        const marketFields = ['ticker', 'price', 'change', 'percentChange', 'volume', 'marketCap', 'peRatio', 'dividendYield', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow'];
        for (const field of marketFields) {
            if (marketSnapshot[field] === undefined) {
                return res.status(400).json({ error: `Missing required marketSnapshot field: ${field}` });
            }
        }
    } else {
        return res.status(400).json({ error: 'marketSnapshot is required in the request body' });
    }

    // Also create a new Journal entry
    const newJournalEntry = new Journal({
        timeOfDay: req.body.timeOfDay,
        shareSize: req.body.shareSize,
        entry: req.body.entry,
        exit: req.body.exit,
        volume: req.body.volume,
        fees: req.body.fees,
        executedDay: req.body.executedDay,
        meta: req.body.meta,
        notes: req.body.notes,
        marketSnapshot: req.body.marketSnapshot // embed the market snapshot
    });

    try {
        const savedShare = await newShare.save();
        await newJournalEntry.save(); // 
        res.status(201).json(savedShare);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};






// DELETE /api/shares/:id
const deleteShares = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedShare = await sharesDetail.findByIdAndDelete(id);
        if (!deletedShare) {
            return res.status(404).json({ error: 'Shares detail not found' });
        }
        res.json({ message: 'Shares detail deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/savedShares
const getSavedShares = async (req, res) => {
    try {
        const savedShares = await sharesDetail.find().sort({ createdAt: -1 });
        res.json(savedShares);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Export controller functions
module.exports = {
    getRoot,
    getShares,
    postShares,
    deleteShares,
    getSavedShares,
    saveSharesDetailAndJournal,
    
};







