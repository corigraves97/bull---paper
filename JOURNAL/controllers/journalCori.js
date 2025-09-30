const router = require('express').Router();
const User = require('../../USER/models/User')
const express = require('express')
const verifyToken = require('../../middleware/verify-token');

router.get('/journal', verifyToken, async (req, res) => {
    try {
        res.send('Hello')
    } catch (err) {
        res.status(500).json({ Err: err.message})
    }
})


module.exports = router