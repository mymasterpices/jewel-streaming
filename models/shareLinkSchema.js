const mongoose = require('mongoose');

const sharelinkSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    videoIds: {
        type: [String], // Array of strings to store video IDs
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically sets the current date and time
        required: true
    }

});

const shareLink = mongoose.model('sharelink', sharelinkSchema);

module.exports = shareLink;