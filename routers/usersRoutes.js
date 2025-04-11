const express = require('express');
const router = express.Router();
const User = require('./../models/userSchema');
const { jwtAuthentication, generateToken } = require('./../jwt');


router.post('/signup', async (req, res) => {
    try {
        const data = req.body;
        const newUser = new User(data);
        const result = await newUser.save();

        const payLoad = {
            id: result._id,
            username: result.username
        }
        const token = generateToken(payLoad);
        console.log('Token saved: ' + token);
        res.status(200).json({
            message: 'User created successfully',
            user: result,
            token: token
        });
    } catch (error) {
        res.status(500).json({ error: 'Error in creating User' });
        console.error(error);
    }
});

//login route
router.post('/signin', async (req, res) => {

    try {
        //extract the username and password
        const { username, password } = req.body;

        const user = await User.findOne({ username: username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invaild username or password' });
        }
        // generate token
        const payLoad = {
            id: user._id,
            username: user.username
        }
        const token = generateToken(payLoad);
        console.log('Token saved: ' + token);
        res.status(200).json({
            message: 'User logged in successfully',
            token: token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//profile route
router.get('/profile', jwtAuthentication, async (req, res) => {
    try {
        const userData = req.user;
        console.log(userData);

        const userId = userData.id;
        const user = await User.findById(userId);

        res.status(200).json({
            message: 'User profile fetched successfully',
            user: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const data = await User.find();
        console.log('data fetched');
        res.status(200).json({
            message: 'Users fetched successfully',
            Users: data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in fetching Users' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const userUpdatedData = req.body;

        const userUpdate = await User.findByIdAndUpdate(userId, userUpdatedData, {
            new: true,
            runValidators: true,
            context: 'query'
        });

        if (!userUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("User updated successfully");
        res.status(200).json({
            message: 'User updated successfully',
            Users: userUpdatedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in updating User' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const userDelete = await User.findByIdAndDelete(userId, {
            new: true
        });
        if (!userDelete) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("User deleted successfully");
        res.status(200).json({
            message: 'User deleted successfully',
            Users: userDelete
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in deleting User' });
    }

});

module.exports = router;