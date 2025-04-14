const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}

// Middleware setup
app.use(cors());
app.use(express.json());
const db = require('./db');
app.use(express.static(path.join(__dirname, 'browser'))); // Serve Angular frontend
app.use('/uploads', express.static(uploadsPath)); // Serve uploaded files

// Logger middleware
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toLocaleDateString()}] Request made to ${req.url}`);
    next();
};
app.use(logRequest);

// Passport auth middleware
const passport = require('./auth');
app.use(passport.initialize());

// Routers
const usersRouter = require('./routers/usersRoutes');
const categoriesRouter = require('./routers/categoriesRoutes');
const videosRouter = require('./routers/videosRoutes');

app.use('/api/users', usersRouter);
app.use('/api/category', categoriesRouter);
app.use('/api/video', videosRouter);

// Wildcard route to serve Angular app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'browser/index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
