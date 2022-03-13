const jwt = require('jsonwebtoken');
const sessionstorage = require('sessionstorage');
const User = require('../models/UserModel');

const checkIsVerified = async (req, res, next) => {

  try {
    // const token = sessionstorage.getItem('jwt');
    let token= req.headers['x-access-token'];
    // console.log(token);
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    var userID = JSON.parse(payload.toString()).id;
    var user = await User.findOne({ _id: userID });
    // console.log(user);
    // if (user.isVerified === true) {
    //   next();
    // }
    if(user){
      next();
    }
    else {
      return res.status(400).json({'err':'Not verified'});
    }
  } catch (error) {
    return res.status(500).json({'err':error.toString()});
  }

}

const checkJWT = async (req, res, next) => {

  const token = sessionstorage.getItem('jwt');
  if (token) {
    jwt.verify(token, 'jwt secret', (err) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
}


module.exports = { checkIsVerified, checkJWT };