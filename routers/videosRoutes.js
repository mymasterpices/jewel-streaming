const express = require('express');
require('dotenv').config(); // <-- FIXED
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const Video = require('../models/videoSchema');
const shareLink = require('../models/shareLinkSchema');
const { jwtAuthentication, generateToken } = require('./../middleware/jwtAuthorization');

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// GET all videos
router.get('/', jwtAuthentication, async (req, res) => {
    try {
        const videos = await Video.find({});
        if (videos.length === 0) {
            return res.status(404).json({ message: 'No videos found' });
        }
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

//get video by tagNumber
router.post('/search', async (req, res) => {
    try {
        const videoTagNumber = req.body.tagNumber;

        if (!videoTagNumber) {
            return res.status(400).json({ error: 'Tag number is required' });
        }

        console.log('Video Tag Number:', videoTagNumber);

        const video = await Video.find({ tagNumber: videoTagNumber }); // Ensure the field name matches your schema

        if (video.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.status(200).json({
            message: 'Video fetched successfully',
            video
        });
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: 'Error in fetching video' });
    }
});

// GET videos by category
router.get('/:category', jwtAuthentication, async (req, res) => {
    try {
        const category = req.params.category;
        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }
        const videos = await Video.find({ category });
        return res.status(200).json(videos);

    } catch (error) {
        console.error('Error fetching videos by category:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});



// POST new video
router.post('/', jwtAuthentication, upload.single('videoUpload'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a video file' });
        }

        const {
            tagNumber, price, goldWeight, diamondWeight,
            stoneWeight, gemStoneWeight, category
        } = req.body;

        const video = new Video({
            tagNumber,
            price: price ? Number(price) : 0,
            goldWeight: goldWeight ? Number(goldWeight) : 0,
            diamondWeight: diamondWeight ? Number(diamondWeight) : 0,
            stoneWeight: stoneWeight ? Number(stoneWeight) : 0,
            gemStoneWeight: gemStoneWeight ? Number(gemStoneWeight) : 0,
            videoUpload: `uploads/${req.file.filename}`,
            category,
        });

        await video.save();

        res.status(200).json({ message: 'Video data uploaded successfully', video });

    } catch (error) {
        console.error('Error uploading video data:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error });
    }
});

// Stream video by ID
router.get('/share-one/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video || !video.videoUpload) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Secure and correct path resolution
        const videoPath = path.join(__dirname, '..', video.videoUpload);

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
        console.error('Error streaming video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST generate shareable link
router.post('/generate-shareable-link', jwtAuthentication, async (req, res) => {
    try {
        const { videoIds, expiryDate, customerName } = req.body;

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ message: 'Video IDs are required and must be an array' });
        }

        if (!expiryDate) {
            return res.status(400).json({ message: 'Expiry date is required' });
        }

        const token = crypto.randomBytes(16).toString('hex');

        const newShareLink = new shareLink({
            token,
            videoIds,
            customerName,
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

// GET videos via share token
router.get('/share/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const shareLinkDoc = await shareLink.findOne({ token });

        if (!shareLinkDoc) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        if (shareLinkDoc.expiryDate < new Date()) {
            return res.status(404).json({ message: 'Link has expired' });
        }

        const videos = await Video.find({ _id: { $in: shareLinkDoc.videoIds } });

        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching shared videos:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.delete('/:id', jwtAuthentication, async (req, res) => {
    try {
        const videoId = req.params.id;

        // Find the video record to get the file path
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Delete the video file from the filesystem
        const videoPath = path.join(__dirname, '..', video.videoUpload);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath); // Synchronously delete the file
        } else {
            console.warn(`File not found: ${videoPath}`);
        }

        // Delete the video record from the database
        const deletedVideo = await Video.findByIdAndDelete(videoId);

        res.status(200).json({
            message: 'Video deleted successfully',
            video: deletedVideo
        });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Error in deleting video' });
    }
});

module.exports = router;
