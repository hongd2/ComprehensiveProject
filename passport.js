var config           = require('./config.js'),
    LocalStrategy    = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy  = require('passport-twitter').Strategy,
    GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy,
    userModel     = require('./model/userModel.js'),
    bcrypt           = require('bcrypt-nodejs'),
    User             = userModel.User;

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {

        // apparently Object user is different for facebook/google and 1st time vs 2nd+ time
        // this is an effort to account for all those differences in Object user
        // you can do console.log(user) to find out how the object is structured
        var userId = null;
        if ("id" in user)
            userId = user.id;
        else if ("user_id" in user)
            userId = user.user_id;
        else
            userId = user.toJSON().user_id;

        done(null, userId);
    });

    passport.deserializeUser(function(id, done) {
        userModel.grabUserCredentials(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(function(username, password, done) {
        new userModel.User({username: username}).fetch().then(function(data) {
            var user = data;
            if (user === null) {
                return done(null, false, { message: 'Invalid username or password' });
            } else {
                user = data.toJSON();
                if (!bcrypt.compareSync(password + user.salt, user.password)) {
                    return done(null, false, { message: 'Invalid password' });
                } else {
                    return done(null, user);
                }
            }
        });
    }));

    passport.use(new FacebookStrategy({
        clientID        : config.facebookAuth.clientID,
        clientSecret    : config.facebookAuth.clientSecret,
        callbackURL     : config.facebookAuth.callbackURL
    }, function(token, refreshToken, profile, done) {
        process.nextTick(function() {
            new userModel.Facebook({ facebook_id: profile.id }).fetch().then(function(fbUser) {
                if (fbUser) {
                    // TODO: Handle case where there IS user, but no facebook user
                    //console.log("got here");
                    //console.log(fbUser);
                    //console.log("--------------------");
                    return done(null, fbUser);
                } else {
                    // If there is no user found, then create one
                    new User().save().then(function(user) {
                        var newUserId = user.toJSON().user_id;

                        var newFBUser = {
                            user_id          : newUserId,
                            token       : token,
                            facebook_id : profile.id,
                            display_name        : profile.displayName    
                        };

                        // Create new Facebook user with token.
                        new userModel.Facebook(newFBUser).save({}, { method: 'insert' }).then(function(facebook) {
                            return done(null, newFBUser);
                        });
                    });
                }
            });
        });
    }));

    passport.use(new GoogleStrategy({
        clientID     : config.googleAuth.clientID,
        clientSecret : config.googleAuth.clientSecret,
        callbackURL  : config.googleAuth.callbackURL
    }, function(token, refreshToken, profile, done) {
        process.nextTick(function() {
            new userModel.Google({google_id: profile.id}).fetch().then(function(goUser) {
                if (goUser) {
                    return done(null, goUser);
                } else {
                    userModel.createNewUser(function(newUserId) {
                        var newGOUser = {
                            user_id           : newUserId,
                            token        : token,
                            google_id    : profile.id,
                            email        : profile.emails[0].value,
                            name         : profile.displayName
                        };

                        new userModel.Google(newGOUser).save({}, { method: 'insert' }).then(function(newlyMadeGOUser) {
                            return done(null, newGOUser);
                        });
                    });
                }
            });
        });
    }));
}
