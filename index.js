const express = require('express');
const path = require('path');
const cors = require('cors');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.static('uploads'));

const passport = require('./auth');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.json());
const db = require('./db');
const port = process.env.PORT || 5000;

// Serve static files from the Angular app's dist folder
app.use(express.static(path.join(__dirname, 'browser')));

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirect all other routes to the Angular app's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'browser/index.html'));
});


//middleware function for log generation
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toLocaleDateString()}] Request made to ${req.url}`);
    next();
}
app.use(logRequest);
//initialize middleware passport
app.use(passport.initialize());
app.use(express.static('uploads'));


app.listen(port, () => console.log(`Server is running on port ${port}`));


//import usersRouter
const usersRouter = require('./routers/usersRoutes');
const categoriesRouter = require('./routers/categoriesRoutes');
const videosRouter = require('./routers/videosRoutes');

app.use('/api/users', usersRouter);
app.use('/api/category', categoriesRouter);
app.use('/api/video', videosRouter);



