// controllers/journalList.js
const express= require("express")
const verifyToken = require("../middleware/verify-token.js")
const Journal = require("../models/journal.js")
const router= express.Router()
const axios = require('axios');


router.get("/", verifyToken, async (req, res) => {
  try {
    const hoots = await Journal.find({})
      .populate("journal")
      .sort({ createdAt: "desc" });
    res.status(200).json(journals);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


router.get("/:journalId", verifyToken, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.journalId).populate("journal");
    res.status(200).json(journal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


