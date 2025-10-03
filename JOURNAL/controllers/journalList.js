// controllers/journalList.js
const express = require("express");
const verifyToken = require("../../middleware/verify-token.js");
const { Journal } = require("../models.js");
const { overView } = require("../../apiClient/controllers/overView.js");

const router = express.Router();


router.get("/", verifyToken, async (req, res) => {
  try {
    const journal = await Journal.find({ userId: req.user._id })
    res.status(200).json(journal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
}); 


router.get("/:journalId", verifyToken, async (req, res) => {
  try {
    const journalEntry = await Journal.findById(req.params.journalId).populate("userId");
    res.status(200).json(journalEntry);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


router.post("/new", verifyToken, async (req, res) => {
  try {
    const {
      marketSnapshotData,
      marketSnapshot,
      sharesDetailData,
      ...journalFields
    } = req.body;

    if (!journalFields.symbol) {
      return res.status(400).json({ error: "Symbol is required to create a journal entry." });
    }

    const symbol = journalFields.symbol.toUpperCase();

    const snapshotPayload = marketSnapshotData ?? marketSnapshot;
    const baseSnapshot = Array.isArray(snapshotPayload)
      ? snapshotPayload[0]
      : snapshotPayload;

    const overviewData = await overView(symbol);
    validateOverviewPayload(symbol, overviewData);
    const snapshot = buildSnapshotFromOverview(symbol, overviewData, baseSnapshot);

    const createdJournal = await Journal.create({
      ...journalFields,
      symbol,
      userId: req.user._id,
      marketSnapshot: snapshot || null,
    });
    res.status(201).json(createdJournal);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ err: err.message });
  }
});


router.put("/:journalId/edit", verifyToken, async (req, res) => {
  try {
    const existingJournal = await Journal.findById(req.params.journalId);

    if (!existingJournal.userId.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const updatePayload = { ...req.body };
    const symbol = (updatePayload.symbol || existingJournal.symbol || "").toUpperCase();

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required to update a journal entry." });
    }

    updatePayload.symbol = symbol;

    const snapshotPayload = updatePayload.marketSnapshot ?? updatePayload.marketSnapshotData;
    const baseSnapshot = Array.isArray(snapshotPayload)
      ? snapshotPayload[0]
      : snapshotPayload;

    const overviewData = await overView(symbol);
    validateOverviewPayload(symbol, overviewData);
    const existingSnapshot = Array.isArray(existingJournal.marketSnapshot)
      ? existingJournal.marketSnapshot[0]
      : existingJournal.marketSnapshot;

    const snapshot = buildSnapshotFromOverview(symbol, overviewData, baseSnapshot);
    updatePayload.marketSnapshot = snapshot || existingSnapshot || null;

    const updatedJournal = await Journal.findByIdAndUpdate(
      req.params.journalId,
      updatePayload,
      { new: true }
    ).populate("userId");


    res.status(200).json(updatedJournal);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ err: err.message });
  } 
});

router.delete("/:journalId", verifyToken, async (req, res) => {
  try {
    const journalToDelete = await Journal.findById(req.params.journalId);

    if (!journalToDelete.userId.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedJournal = await Journal.findByIdAndDelete(req.params.journalId);
    res.status(200).json(deletedJournal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;

const OVERVIEW_FIELD_MAP = {
  name: "Name",
  description: "Description",
  exchange: "Exchange",
  currency: "Currency",
  country: "Country",
  sector: "Sector",
  industry: "Industry",
  fiscalYearEnd: "FiscalYearEnd",
  latestQuarter: "LatestQuarter",
  marketCap: "MarketCapitalization",
  peRatio: "PERatio",
  pegRatio: "PEGRatio",
  bookValue: "BookValue",
  dividendPerShare: "DividendPerShare",
  dividendYield: "DividendYield",
  eps: "EPS",
  profitMargin: "ProfitMargin",
  operatingMargin: "OperatingMarginTTM",
  returnOnAssets: "ReturnOnAssetsTTM",
  returnOnEquity: "ReturnOnEquityTTM",
  revenueTTM: "RevenueTTM",
  grossProfitTTM: "GrossProfitTTM",
  analystTargetPrice: "AnalystTargetPrice",
  fiftyTwoWeekHigh: "52WeekHigh",
  fiftyTwoWeekLow: "52WeekLow",
  fiftyDayMovingAverage: "50DayMovingAverage",
  twoHundredDayMovingAverage: "200DayMovingAverage",
  sharesOutstanding: "SharesOutstanding",
  percentInsiders: "PercentInsiders",
  percentInstitutions: "PercentInstitutions",
  beta: "Beta",
};

const NUMERIC_OVERVIEW_FIELDS = new Set([
  "marketCap",
  "peRatio",
  "pegRatio",
  "bookValue",
  "dividendPerShare",
  "dividendYield",
  "eps",
  "profitMargin",
  "operatingMargin",
  "returnOnAssets",
  "returnOnEquity",
  "revenueTTM",
  "grossProfitTTM",
  "analystTargetPrice",
  "fiftyTwoWeekHigh",
  "fiftyTwoWeekLow",
  "fiftyDayMovingAverage",
  "twoHundredDayMovingAverage",
  "sharesOutstanding",
  "percentInsiders",
  "percentInstitutions",
  "beta",
]);

function validateOverviewPayload(symbol, overviewPayload) {
  if (!overviewPayload || typeof overviewPayload !== "object") {
    const error = new Error(`Missing overview data for symbol ${symbol}.`);
    error.statusCode = 502;
    throw error;
  }

  const errorMessage =
    overviewPayload.Note ||
    overviewPayload.Information ||
    overviewPayload["Error Message"];

  if (errorMessage) {
    const error = new Error(`Alpha Vantage overview error for ${symbol}: ${errorMessage}`);
    error.statusCode = 502;
    throw error;
  }
}

function buildSnapshotFromOverview(symbol, overviewPayload, baseSnapshot = {}) {
  if (!overviewPayload || typeof overviewPayload !== "object") {
    return baseSnapshot ? { ...baseSnapshot, symbol } : null;
  }

  const overview = normalizeOverviewData(overviewPayload);

  return {
    ...(baseSnapshot && typeof baseSnapshot === "object" ? baseSnapshot : {}),
    symbol,
    overview: Object.keys(overview).length ? [overview] : [],
    fetchedAt: new Date(),
  };
}

function normalizeOverviewData(rawOverview) {
  const normalized = {};

  Object.entries(OVERVIEW_FIELD_MAP).forEach(([schemaKey, sourceKey]) => {
    const rawValue = rawOverview[sourceKey];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return;
    }

    if (NUMERIC_OVERVIEW_FIELDS.has(schemaKey)) {
      const numericValue = parseNumeric(rawValue);
      if (numericValue !== null) {
        normalized[schemaKey] = numericValue;
      }
    } else {
      normalized[schemaKey] = rawValue;
    }
  });

  return normalized;
}

function parseNumeric(value) {
  const sanitized = String(value).replace(/,/g, "").trim();
  if (!sanitized) {
    return null;
  }

  const candidate = Number(sanitized);
  return Number.isFinite(candidate) ? candidate : null;
}