const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//define user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//     const user = this;
//     if (!user.isModified('password')) return next();

//     try {
//         // const hashedPassword = await bcrypt.hash(user.password, 10);
//         // user.password = hashedPassword;

//         const salt = await bcrypt.genSalt(8);
//         // hashing the password 
//         const hashedPassword = await bcrypt.hash(user.password, salt);
//         user.password = hashedPassword;
//         next();
//     } catch (error) {
//         return next(error);
//     }

// });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.pre('findOneAndUpdate', async function (next) {
    if (!this.getUpdate().password) return next();
    try {
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(this.getUpdate().password, salt);
        this.getUpdate().password = hashedPassword;
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.comparePassword = async function (usersPassword) {
    try {
        //match the password
        const isMatch = await bcrypt.compare(usersPassword, this.password);
        return isMatch;
    } catch (error) {
        throw error;
    }
};

// create model class

const User = mongoose.model('User', userSchema);
module.exports = User;