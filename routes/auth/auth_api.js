var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var config = require('../../config');
var my_errno = require('../../lib/my_errno');
var ip = require('ip');

// Used to encrypt user password before adding it to db.
var bcrypt = require('bcrypt-nodejs');

// Bookshelf postgres db ORM object. Basically it makes
// it simple and less error port to insert/query the db.
var userModel     = require('../../model/userModel.js');

router.post('/api/signout', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end(JSON.stringify({"error": "You're not signed in"}));
    } else {
        req.logout();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({"message": "log out successfully"}));
    }
});

router.get('/api/checkcookie', function (req, res, next){
    if (!req.isAuthenticated()) {
        res.writeHead(400, {"Content-Type": "application/json"});
        res.end(JSON.stringify({"error": "cookie failed"}));
    } else {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({"message": "cookie works"}));
    }
});

router.post('/api/signup', function(req, res, next) {
    // Here, req.body is { username, password , passwordRepeat}
    var user = req.body;

    // check if user type in two password identically
    if (user.password != user.passwordRepeat){
        next(new UserError("Passwords didn't match"));
    } else {
        // Before making the account
        // try and fetch a username to see if it already exists.
        var usernamePromise =
            new userModel.User({ username: user.username }).fetch();

        return usernamePromise.then(function(model) {
            if (model) {
                next(new UserError("Username already exists"));
            } else {
                var password = user.password;

                // create salt of length 16 bytes
                var salt = crypto.randomBytes(16).toString('base64');
                // hash with salt too
                var hash = bcrypt.hashSync(password + salt);

                // Make a new postgres db row of the account
                // By default, the user is only a diner
                var signUpUser = new userModel.User({
                    username: user.username,
                    password: hash,
                    salt: salt,
                    manager_flag: false,
                    waiter_flag: false,
                    diner_flag: true
                });

                signUpUser.save({}, {method: 'insert'}).then(function(model) {
                    res.status(200).send(JSON.stringify({
                        message: "Sign up successfully"
                    }));
                });
            }
        });
    }
});

router.post('/api/signin', function(req, res, next) {
    passport.authenticate('local', {}, function(err, user, info) {
        if (err) {
            next(new my_errno.UserError(err.message));
            return ;
        }

        if (!user) {
            next(new my_errno.UserError("Credential mismatched"));
            return;
        }

        user.id = user.user_id;

        return req.logIn(user, function(err) {
            if (err) {
                next(new my_errno.UserError(err.message));
            } else {
                if ('password' in user) delete user.password;
                if ('salt' in user) delete user.salt;
                res.status(200).type('json').send(JSON.stringify(user));
            }
        });
    })(req, res, next);
});

// Export the module
module.exports = router;

