var express = require('express');
var router = express.Router();
var waiter_db_inf = require('../../model/waiterDbInf.js');
var s3 = require('../../lib/s3');
var fs = require('fs');

router.get('/', function(req, res, next){
    if (req.isAuthenticated()) {
        var user = req.user;
        waiter_db_inf.getInfoAndRatingForWaiter({
            waiter_id: user.user_id
        }).then(function(waiter){
            res.render('waiter/waiterMainPanel', {user: user, waiter: waiter});
        }).catch(function(err){
            next(err);   
        });
    } else {
        res.redirect('/signin');
    }
});

router.get('/profile', function(req, res, next){
    if (req.isAuthenticated()) {
        var user = req.user;
        waiter_db_inf.getInfoAndRatingForWaiter({
            waiter_id: user.user_id
        }).then(function(waiter){
            res.render('waiter/waiterEditProfile', {user: user, waiter: waiter});
        }).catch(function(err){
            next(err);   
        });
    } else {
        res.redirect('/signin');
    }
});


router.post('/profile', s3.uploadSetting.single('waiterpic'), function(req, res, next){
    if (req.isAuthenticated()) {
        var user = req.user;
        var newProfile = req.body;

        s3.uploadImageToS3(req.file.path)
            .then(function(newImageLink){
                // show the image link on imgur
                //console.log("new link = ", json.data.link);
                // delete local temp file
                fs.unlink(req.file.path);

                waiter_db_inf.updateWaiterProfile({
                    waiter_id: user.user_id,
                    waiter_name: newProfile.waitername,
                    waiter_pic: newImageLink,
                    waiter_profile: newProfile.waiterprofile
                }).then(function(newProfileRecord){
                    waiter_db_inf.getInfoAndRatingForWaiter({
                        waiter_id: user.user_id
                    }).then(function(waiter){
                        res.render('waiter/waiterEditProfile', {user: user, waiter: waiter, goodMessage: "Changed profile successfully"});
                    }).catch(function(err){
                        next(err);   
                    });
                }).catch(function(err){
                    next(err);   
                });
            });
    } else {
        res.redirect('/signin');
    }
});

module.exports = router;
