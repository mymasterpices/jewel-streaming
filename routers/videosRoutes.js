const express = require('express');
require('dotenv').config;
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const Video = require('../models/videoSchema');
const shareLink = require('../models/shareLinkSchema');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });


//Routing 
router.get('/', async (req, res) => {

    try {
        const videos = await Video.find({});
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Internal server error', error: error });
    }
});

// Route to fetch videos by category
router.get('/:category', async (req, res) => {
    try {
        const category = req.params.category;

        // Fetch videos by category
        const videos = await Video.find({ category });
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos by category:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


router.post('/', upload.single('videoUpload'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a video file' });
        }
        const { tagNumber, price, goldWeight, diamondWeight, stoneWeight, gemStoneWeight, category,
        } = req.body;

        const video = new Video({
            tagNumber,
            price: price ? Number(price) : 0,
            goldWeight: goldWeight ? Number(goldWeight) : 0,
            diamondWeight: diamondWeight ? Number(diamondWeight) : 0,
            stoneWeight: stoneWeight ? Number(stoneWeight) : 0,
            gemStoneWeight: gemStoneWeight ? Number(gemStoneWeight) : 0,
            videoUpload: `uploads/${req.file.filename}`, // Save the file path
            category,
        });

        await video.save();

        res.status(200).json({ message: 'Video data uploaded successfully', video });

    } catch (error) {

        console.error('Error uploading video data:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error: error });
    }
});

router.get('/share-one/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        // console.log(video);
        if (!video || !video.videoUpload) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const videoPath = path.join(video.videoUpload);

        // Check if file exists
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ error: 'Video file not found' });
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            const fileStream = fs.createReadStream(videoPath, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": "video/mp4"
            });

            fileStream.pipe(res);
        } else {
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": "video/mp4"
            });

            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.post('/generate-shareable-link', async (req, res) => {
    try {
        const { videoIds, expiryDate } = req.body;

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ message: 'Video IDs are required and must be an array' });
        }

        if (!expiryDate) {
            return res.status(400).json({ message: 'Expiry date is required' });
        }

        // Generate a unique token
        const token = crypto.randomBytes(16).toString('hex');

        // Save the token, video IDs, and expiry date in the database
        const newShareLink = new shareLink({
            token,
            videoIds,
            expiryDate: new Date(expiryDate),
            createdAt: new Date()
        });

        await newShareLink.save();

        res.status(201).json({ message: 'Shareable link generated successfully', token });
    } catch (error) {
        console.error('Error generating shareable link:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});



router.get('/share/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Retrieve the document associated with the token
        const shareLinkDoc = await shareLink.findOne({ token });

        if (!shareLinkDoc) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        // Check if the link has expired
        if (shareLinkDoc.expiryDate < new Date()) {
            return res.status(404).json({ message: 'Link has expired' });
        }

        // Extract videoIds from the document
        const videoIds = shareLinkDoc.videoIds;

        if (!videoIds || videoIds.length === 0) {
            return res.status(404).json({ message: 'No videos found for this link' });
        }

        // Fetch videos from the database using videoIds directly
        const videos = await Video.find({ _id: { $in: videoIds } });

        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos for shareable link:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


module.exports = router;