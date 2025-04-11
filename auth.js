
const User = require("./models/userSchema");

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(async (USERNAME, password, done) => {
    //authentication logic
    try {
        //check if user exists and password matches
        const user = await User.findOne({ username: USERNAME });
        if (!user)
            return done(null, false, { message: 'Incorrect username' });

        // const isPasswordMatch = user.password === password ? true : false;
        const isPasswordMatch = user.comparePassword(password);

        if (isPasswordMatch)
            return done(null, user);
        else
            return done(null, false, { message: 'Incorrect password' });

    } catch (error) {
        return done(error);
    }
}));

module.exports = passport;