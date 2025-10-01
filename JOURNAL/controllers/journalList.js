// controllers/journalList.js
const express= require("express")
const verifyToken = require("../../middleware/verify-token.js")
const { Journal } = require("../models.js");//import model 
console.log(Journal)
const router= express.Router()
const axios = require('axios');
// const { createCollection } = require("../../USER/models/User.js");

//index
router.get("/", verifyToken, async (req, res) => {
  try {
    const journal = await Journal.find({})
      .populate("author")
      .sort({ createdAt: "desc" });
    res.status(200).json(journal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

//show 
router.get("/:journalId", verifyToken, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.journalId).populate("author");
    res.status(200).json(journal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
});

///create  journal 
router.post("/new", verifyToken, async (req, res) => {
  try {
    const { marketSnapshotData } = req.body
    //console.log(req.user._id)
   const journal = await Journal.create({
      ...req.body, ///gt all info
      userId: req.user._id,
      marketSnapshotData: marketSnapshotData,   
    }); 
    console.log(journal)
    res.status(201).json(journal);
  } catch (err) {
    console.error("🔥 Error in GET /journal:", err);
    res.status(500).json({ err: err.message });
  }
});

//update 
router.put("/:journalId/edit", verifyToken, async (req, res) => {
  try {
    // Find the journal:
    const journal = await Journal.findById(req.params.journalId);

    // Check permissions--make sure that journal is users:
    if (!journal.userId.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update journal:
    const updatedJournal = await Journal.findByIdAndUpdate(
      req.params.journalId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property:
    updatedJournal._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedJournal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  } //
});

router.delete("/:journalId", verifyToken, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.journalId);

    if (!journal.userId.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedJournal = await Journal.findByIdAndDelete(req.params.journalId);
    res.status(200).json(deletedJournal);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;