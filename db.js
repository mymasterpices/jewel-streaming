const mongoose = require('mongoose');
require('dotenv').config();
//define mongoDBConfig
const mongoDBRL = process.env.mongoDBurl;

mongoose.connect(mongoDBRL);

const db = mongoose.connection;
db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});
db.on('disconnect', () => {
    console.log('MongoDB disconnected');
});


module.exports = db;