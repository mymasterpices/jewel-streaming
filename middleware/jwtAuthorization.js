const jwt = require('jsonwebtoken');
require('dotenv').config;

const jwtAuthentication = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Token required' })

    const token = req.headers.authorization.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access denied unthorized user.' });
    try {
        //verify toke
        const decoded = jwt.verify(token, process.env.JWT_SECRET_key);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({ message: 'Invalid token.' });
    }
}
//function for generate JWT token
const generateToken = (userUpdate) => {
    //generate new JWT token
    return jwt.sign(userUpdate, process.env.JWT_SECRET_key);
}

module.exports = { jwtAuthentication, generateToken };