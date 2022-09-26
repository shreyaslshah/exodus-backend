const { Router } = require('express');
const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const sessionstorage = require('sessionstorage');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const { checkIsVerified } = require('../middleware/authMiddleware');
const { verifyToken } = require('../middleware/usercheck');
const constructTemplate = require('../utils/emailTemplate');

const router = Router();


/* *********************************************************** */

const handleErrors = (error) => {

  let errorMessage = { name: '', email: '', password: '' };

  // wrong email/password during login error
  if (error.message === 'incorrect email') {
    errorMessage.email = 'that email is not registered';
  }
  if (error.message === 'incorrect password') {
    errorMessage.password = 'password is incorrect';
  }

  // username/email not available during signup error
  if (error.code === 11000) {
    if (error.keyValue.username) {
      errorMessage.username = 'That username is not available';
    }
    if (error.keyValue.email) {
      errorMessage.email = 'That email is already registered';
    }
  }

  // validation failed during signup error
  if (error.message.includes('users validation failed')) {
    Object.values(error.errors).forEach((err) => {
      errorMessage[err.properties.path] = err.properties.message;
    });
  }

  return errorMessage;
}

/* *********************************************************** */

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'jwt secret', {
    expiresIn: maxAge
  })
}

/* *********************************************************** */

router.get('/', checkIsVerified, verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ 'err': 'User not found' });
    }
    res.json(user);
  }
  catch (err) {
    return res.status(500).json({ 'err': err.toString() });
  }
})

/* *********************************************************** */

router.get('/signup', (req, res) => {
  res.send('signup page');
})

/* *********************************************************** */

router.post('/signup', async (req, res) => {
  const { name, email, password, college, phoneno } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      password,
      college,
      phoneno,
      isVerified: false
    });
    if (!user) {
      return res.status(400).json({ 'msg': 'Could not create user' });
    }
    const token = createToken(user._id);
    sessionstorage.setItem('jwt', token);

    var transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      auth: {
        user: "arshiaputhran@outlook.com",
        pass: "aditya12"
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    const message = constructTemplate(name, `http://${req.headers.host}/api/auth/verify-email?uid=${user._id}&token=` + token, email);
    const options = {
      from: "arshiaputhran@outlook.com",
      to: email,
      subject: 'Email verification',
      text: `Go to this link: `,
      // html: `<a href='http://${req.headers.host}/api/auth/verify-email?uid=${user._id}'>click to verify</a>`
      html: message
    }

    transporter.sendMail(options, function (err, info) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(req.headers.host);
      console.log('verification email sent');
    })

    res.status(201).json(user);
  }

  catch (error) {
    console.log(error);
    let errorMessage = handleErrors(error);
    console.log(errorMessage);
    res.status(400).json({ errorMessage, 'err': error.toString() });
  }

})

/* *********************************************************** */

router.get('/verify-email', verifyToken, async (req, res) => {
  try {
    //req.query.uid
    console.log(req.userId);
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      console.log('could not find user');
    }
    else {
      await user.updateOne({ isVerified: true })
        .then(console.log('user email is verified'));
    }
  } catch (error) {
    console.log(error);
  }
  res.send('verfy email page');
})

/* *********************************************************** */

router.get('/login', (req, res) => {
  res.send('login page');
})

/* *********************************************************** */

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, " ", password);

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    sessionstorage.setItem('jwt', token);

    res.status(200).json({ user, token });
  }
  catch (error) {
    let errorMessage = handleErrors(error);
    console.log(error);
    console.log(errorMessage);
    res.status(400).json({ errorMessage });
  }
})

/* *********************************************************** */

router.post('/forgot-password', async (req, res) => {

  const { email } = req.body;

  var user = await User.findOne({ email: email });

  if (!user) {
    console.log('that email id is not registered');
  }

  var transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: {
      user: "arshiaputhran@outlook.com",
      pass: "aditya12"
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  const options = {
    from: "arshiaputhran@outlook.com",
    to: email,
    subject: 'password reset link',
    text: `go to this link: `,
    html: `<a href='http://${req.headers.host}/api/auth/reset-password?uid=${user._id}'>click to reset password</a>`
  }

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('reset password email sent');
  })

  res.status(201).json(user);

})

/* *********************************************************** */

router.post('/reset-password', async (req, res) => {

  var { password } = req.body;
  const salt = await bcrypt.genSalt();
  password = await bcrypt.hash(password, salt);

  try {
    const user = await User.findOne({ _id: req.query.uid });
    await user.updateOne({ password: password })
      .then(console.log('password has been updated'));
  } catch (error) {
    console.log(error);
    res.status(400).send({ 'err': error.toString() });
    return;
  }

  res.status(201).send('password has been reset');

})

module.exports = router;