const jwt = require('jsonwebtoken');
const userModel = require('../models/UserModel.js');
const sessionstorage = require('sessionstorage');


const verifyToken = async (req, res, next) => {
    let token = req.headers['x-access-token'] || req.query.token;
    // console.log(token);
    // console.log(req.query);

    if (!token) {
        return res.status(403).json({ message: "Token not found" });
    }
    jwt.verify(token, 'jwt secret', (err, decoded) => {
        if (err) {
            // res.redirect('/login');
            return res.json({ 'err': 'Not authorized' });
        }
        else {
            req.userId = decoded.id;
            // console.log(req.userId);
            next();
        }
    })
}

const checkuser = async (req, res, next) => {
    try {
        const token = sessionstorage.getItem('jwt');
        // console.log(token);
        var base64Payload = token.split('.')[1];
        var payload = Buffer.from(base64Payload, 'base64');
        var userID = JSON.parse(payload.toString()).id;
        if (req.body.userId && req.body.userId !== userId) {
            res.redirect('/login');
        }
        else {
            next();
        }
    }
    catch {
        res.redirect('/login')
    }
};

module.exports = { verifyToken, checkuser };
