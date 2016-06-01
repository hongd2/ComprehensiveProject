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

// --------------------------------------------------
// Routes for signing in/up
// --------------------------------------------------
router.get('/signin', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/console');
    } else {
        res.render('auth/signin', {});
   }
});

router.get('/signup', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/console');
    } else {
        res.render('auth/signup', {});
    }
});


// Add user to database.
router.post('/signin', function(req, res, next) {
    //console.log(req.body);
    passport.authenticate('local', {
                         successRedirect: '/',
                         failureRedirect: '/signin'
    }, function(err, user, info) {
        if (err) {
            // console.log("got here 1");
            return res.render('auth/signin', 
                { title: 'Sign In', errorMessage: err.message });
        }

        if (!user) {
            return res.render('auth/signin', 
                { title: 'Sign In', errorMessage: info.message });
        }

        user.id = user.user_id;

        return req.logIn(user, function(err) {
            if (err) {
                return res.render('auth/signin', 
                    { title: 'Sign In', errorMessage: err.message });
            } else {
                return res.redirect('/console');
            }
        });
    })(req, res, next);
});

router.post('/signup', function(req, res, next) {
    // Here, req.body is { username, password , passwordRepeat}
    var user = req.body;

    // check if user type in two password identically
    if (user.password != user.passwordRepeat){
        res.render('auth/signup', 
            { activeTab: 1, errorMessage: "Passwords didn't match" });
    } else {
        // Before making the account, try and fetch a username to see if it already exists.
        var usernamePromise = new userModel.User({ username: user.username }).fetch();

        return usernamePromise.then(function(model) {
            if (model) {
                res.render('auth/signup', 
                    { activeTab: 1, errorMessage: 'username already exists' });
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
                    diner_flag: true });

                signUpUser.save({}, {method: 'insert'}).then(function(model) {
                    // Sign in the newly registered uesr
                    res.redirect(307, '/signin');
                });
            }
        });
    }
});

router.get('/signout', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect(307, '/', { errorMessage: 'You are not logged in' });
    } else {
        req.logout();
        res.redirect('/signin');
    }
});


// This route give the sample control panel
router.get('/sample', function(req, res, next){
    res.render('dev/samplePanel', {});
});


// Export the module
module.exports = router;

