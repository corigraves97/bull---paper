// controllers/users.js

const express = require('express');
const router = express.Router();
const User = require('../models/users');
const verifyToken = require('../middleware/verify-token');

///added middleware 

router.get("/",verifyToken, async (req, res)=>{
  try{
    const users = await User.find({}, "username")
    return res.status(200).json(users)

  }catch(error){
    console.log(error)

  }
    
})


router.get('/:userId', verifyToken, async (req, res) => {
  try {
    // If the user is looking for the details of another user, block the request
    // Send a 403 status code to indicate that the user is unauthorized
    if (req.user._id !== req.params.userId){
      return res.status(403).json({ err: "Unauthorized"});
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ err: 'User not found.'});
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
