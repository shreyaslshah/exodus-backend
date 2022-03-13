let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const ShortUniqueId = require("short-unique-id");
const Teams = require("../models/TeamModel");
const User = require("../models/UserModel");
const { checkIsVerified, checkJWT } = require('../middleware/authMiddleware');
const {verifyToken} = require('../middleware/usercheck');


// *******************************************************



// ******************************************************

router.post("/user-create", async (req, res, next) => {
  const { username, email, password, public } = req.body;
  console.log("hello");
  try {
    const newUser = new User({
      username: username,
      email: email,
      password: password,
      public: public,
      requestSent: [],
      requestReceived: [],
      friends: [],
    });

    console.log(newUser);

    await newUser.save();
    return res.status(200).send(newUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});



router.post("/toggle-public/:id",verifyToken, async (req, res, next) => {
  // const { username } = req.body;

  try {
    // const user = await User.findOne({ username: username });
    const discord = req.body.discordid;
    const user = await User.findOneAndUpdate({_id:req.params.id},{discordid:discord},{new:true});
    if (user.public === false) {
      await user.updateOne({ public: true });
    }
    else if (user.public === true) {
      await user.updateOne({ public: false });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
  }
});

router.put("/send-request",verifyToken, async (req, res) => {
  console.log(req.body);
  const { currentUserId, requestedUserId } = req.body;

  try {
    try {
      const currentUser = await User.findOne({ _id: currentUserId });
      const requestedUser = await User.findOne({ _id: requestedUserId });

      //following code checks so that user cannot send multiple requests to the same person
  
      // if (
      //   (currentUser.requestSentPending!=undefined && requestedUser.requestReceivedPending!=undefined) &&
      //   (currentUser.requestSentPending.length>0 && requestedUser.requestReceivedPending.length>0)
      //    &&
      //   currentUser.requestSentPending.indexOf(requestedUserId) != -1 ||
      //   requestedUser.requestReceivedPending.indexOf(currentUserId) != -1
      // ) {
      //   return res
      //     .status(401)
      //     .json("You cannot send multiple connection requests!");
      // } else if (
      //   (currentUser.friends!=undefined && requestedUser.friends!=undefined)&&
      //   (currentUser.friends.length>0 && requestedUser.friends.length>0) &&
      //   currentUser.friends.indexOf(requestedUserId) != -1 ||
      //   requestedUser.friends.indexOf(currentUserId) != -1
      // ) {
      //   return res
      //     .status(401)
      //     .json("The user requested is already a connection!");
      // }
      // console.log(requestedUser);
      const requestexists = await User.exists({_id:currentUserId,requestSentPending:requestedUserId});
      const reqrecexists = await User.exists({_id:requestedUserId,requestReceivedPending:currentUserId});
      const friendexists1 = await User.exists({_id:currentUserId,friends:requestedUserId});
      const friendexists2 = await User.exists({_id:requestedUserId,friends:currentUserId});
      console.log(requestexists+" "+reqrecexists+" "+friendexists1+" "+friendexists2);
      if(requestexists || reqrecexists){
        return res
          .status(401)
          .json("You cannot send multiple connection requests!");
      }
      else if(friendexists1 || friendexists2){
        return res
            .status(401)
            .json("The user requested is already a connection!");
      }


      const updatedCurrentUser = await User.findOneAndUpdate(
        { _id: currentUserId },
        { $push: { requestSentPending: requestedUserId } },
        { new: true }
      ).populate('username','_id');
      const updatedRequestedUser = await User.findOneAndUpdate(
        { _id: requestedUserId },
        { $push: { requestReceivedPending: currentUserId } },
        { new: true }
      ).populate('username','_id');

      res.status(200).json({ updatedCurrentUser, updatedRequestedUser });
    } catch (error) {
      return res.status(500).json({'err':error.toString()});
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.put("/accept-request",verifyToken, async (req, res) => {
  const { currentUserId, requestedUserId } = req.body;

  try {
    try {
      const currentUser = await User.findOne({ _id: currentUserId });
      const requestedUser = await User.findOne({ _id: requestedUserId });
      // if (
      //   currentUser.requestSentPending.indexOf(requestedUserId) == -1 ||
      //   requestedUser.requestReceivedPending.indexOf(currentUserId) == -1
      // ) {
      //   return res.status(401).json("Error in accepting request!");
      // }
      const test1 = await User.exists({_id:currentUserId,requestSentPending:requestedUserId});
      const test2 = await User.exists({_id:requestedUserId,requestReceivedPending:currentUserId});
      console.log(test1+" "+test2);
      if(!test1 || !test2){
        return res.status(401).json("Error in accepting request!");
      }

      const updatedRequestedUser = await User.findOneAndUpdate(
        { _id: requestedUserId },
        {
          $push: { friends: currentUserId },
          $pull: { requestReceivedPending: currentUserId },
        },
        { new: true }
      );

      const updatedCurrentUser = await User.findOneAndUpdate(
        { _id: currentUserId },
        {
          $push: { friends: requestedUserId },
          $pull: { requestSentPending: requestedUserId },
        },
        { new: true }
      );

      res.status(200).json({ updatedCurrentUser, updatedRequestedUser });
    } catch (error) {
      return res.status(500).json({'err':error.toString()});
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// *******************************************************


// *******************************************************




// Listing public users

router.get("/public-users",verifyToken, async (req, res, next) => {
  let publicBool = true;
  try {
    let publicUsers;
    publicUsers = await User.find({
      public: {
        $in: [publicBool],
      },
    });
    res.status(200).json(publicUsers);
  } catch (err) {
    res.status(500).json(err);
  }
});

//recieved requests
router.get("/requests/:id",verifyToken,async(req,res)=>{
  try{
    const user = await User.findOne({_id:req.params.id}).populate('requestReceivedPending');
    if(!user){
      return res.status(404).json({'err':'User not found'});
    }
    //console.log(user);
    res.json(user.requestReceivedPending);
  }
  catch(err){
    res.status(500).json({'err':err.toString()});
  }
})

//sent requests
router.get("/sent-requests/:id",verifyToken,async(req,res)=>{
  try{
    const user = await User.findOne({_id:req.params.id}).populate('requestSentPending');
    if(!user){
      return res.status(404).json({'err':'User not found'});
    }
    res.json(user.requestSentPending);
  }
  catch(err){
    res.status(500).json({'err':err.toString()});
  }
})

router.get("/friends/:id",verifyToken,async(req,res)=>{
  try{
    const user = await User.findOne({_id:req.params.id}).populate('friends');
    if(!user){
      return res.status(404).json({'err':'User not found'});
    }
    res.json(user.friends);
  }
  catch(err){
    res.status(500).json({'err':err.toString()});
  }
})

module.exports = router;
