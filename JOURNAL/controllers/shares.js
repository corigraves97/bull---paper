const sharesAvailable = require('../../apiClient/eaches/shares.js');
const { SharesDetail: sharesDetail,
    Journal: Journal,
    MarketSnapshot: marketSnapshotSchema,
    Overview: Overview,
    NewsArticle: NewsArticle,
    TickerSentiment: TickerSentiment,
 } = require('../models.js');




const getRoot = async (req, res) => {
    res.send('Shares API is working');
};


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

    const { sharesDetailData, marketSnapshotData } = req.body;


    const newShare = new sharesDetail(sharesDetailData);


    const newJournalEntry = new Journal({
        ...sharesDetailData,
        marketSnapshot: marketSnapshotData
    });


    try {
        const savedShare = await newShare.save();
        const savedJournalEntry = await newJournalEntry.save();
        res.status(201).json({ savedShare, savedJournalEntry });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};




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

    const newShare = new sharesDetail(req.body); 
    const marketSnapshot = req.body.marketSnapshot; 
    console.log('Market Snapshot:', marketSnapshot); 
   
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
        marketSnapshot: req.body.marketSnapshot 
    });

    try {
        const savedShare = await newShare.save();
        await newJournalEntry.save(); 
        res.status(201).json(savedShare);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};







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


const getSavedShares = async (req, res) => {
    try {
        const savedShares = await sharesDetail.find().sort({ createdAt: -1 });
        res.json(savedShares);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getRoot,
    getShares,
    postShares,
    deleteShares,
    getSavedShares,
    saveSharesDetailAndJournal,
    
};







