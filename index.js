const express = require('express');
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
const port = process.env.port;

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

app.get('/', (req, res) => {
    res.send("Welcome to Jewel Streaming!");
});

//import usersRouter
const usersRouter = require('./routers/usersRoutes');
const categoriesRouter = require('./routers/categoriesRoutes');
const videosRouter = require('./routers/videosRoutes');

app.use('/api/users', usersRouter);
app.use('/api/category', categoriesRouter);
app.use('/api/video', videosRouter);



