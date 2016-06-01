var express = require('express');
var router = express.Router();
var diner_db_inf = require('../../model/dinerDbInf.js');
var rest_db_inf = require('../../model/restaurantDbInf.js');
var waiter_db_inf = require('../../model/waiterDbInf.js');
var manager_db_inf = require('../../model/managerDbInf.js');
var rating_db_inf = require('../../model/ratingDbInf.js');
var path = require('path');
var combineData = require('../../lib/combineData');
var config = require('../../config');
var s3 = require('../../lib/s3');
var fs = require('fs');

router.get('/', function(req, res, next){
    if (req.isAuthenticated()) {
        var user = req.user;
        res.render('manager/managerMainPanel', {user: user});
    } else {
        res.redirect('/signin');
    }
});

router.get('/restaurants', function(req, res, next) {
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        //console.log("GET restaurantStatus", user);

        // get list of all restaurants of this manager
        manager_db_inf
            .getManagerWithRestaurants({manager_id: user.user_id})
            .then(function(manager){
                // console.log("found manager = ", manager.toJSON());
                res.render(
                    'manager/restaurantManagePanel',
                    {user: user, restaurants: manager.toJSON().restaurants});
            });
    }
});


router.get('/addNewRestaurant', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        //console.log("GET addNewRestaurant", user);
        res.render('manager/newRestaurantPanel', {user: user});
    }

});

router.get('/createRestaurantQR', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        res.render('manager/createQR', {user: user});
    }

});

router.post('/addNewRestaurant', s3.uploadSetting.single('restaurantPicture'), function(req, res, next){

    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        var newRestaurantDetail = req.body;

        // 1st argument is path to file and 2nd argument is album id


        s3.uploadImageToS3(req.file.path)
            .then(function(newImageLink){
                // show the image link
                // console.log("new link = ", newImageLink);
                // delete local temp file
                fs.unlink(req.file.path);

                // add restaurant info to database
                rest_db_inf.createNewRestaurant({
                    name:  newRestaurantDetail.restaurantName,
                    address: newRestaurantDetail.restaurantAddress,
                    num_table: newRestaurantDetail.restaurantNumTable,
                    picture: newImageLink})
                .then(function(newRestaurant) {
                    // record that this person is the manager
                    manager_db_inf.addNewRestaurantManagement({
                        restaurant_id:  newRestaurant.toJSON().restaurant_id,
                        manager_id: user.user_id
                    }).then(function(newManagement) {
                        res.render('manager/newRestaurantPanel', {user: user, goodMessage: "Restaurant added successfully"});
                    });

                }).catch(function(err){
                    console.error(err);
                    res.render('manager/newRestaurantPanel', {user: user, errorMessage: "Fail to add restaurant"});
                });
            })
            .catch(function(err){
                next(err);
            });
    }
});

router.get('/waiters', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        manager_db_inf
            .getManagerWithAllWaiters({manager_id: user.user_id})
            .then(function(manager){
                    var total_waiter = [];
                    var waiter_id_set = new Set();
                    var i;
                    for (i=0; i<manager.toJSON().restaurants.length; i++)
                    {
                        for (var j = 0; j < manager.toJSON().restaurants[i].all_waiters.length; j++) {
                            var waiter = manager.toJSON().restaurants[i].all_waiters[j];
                            if (!waiter_id_set.has(waiter.user_id)){
                                total_waiter.push(waiter);
                                waiter_id_set.add(waiter.user_id);
                            }
                        }

                    }
                    res.render(
                    'manager/waiterManagePanel',
                        {user: user, all_waiters:total_waiter});
            });
    }
});

router.get('/addNewWaiter', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        //console.log("GET addNewWaiter", user);
        res.render('newWaiterPanel', {user: user});
    }
});

router.get('/restaurant/:id', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        var restaurant_id = req.params.id;
        rest_db_inf.getFullStatus({ restaurant_id: restaurant_id})
            .then(function(restaurant){
                res.render('manager/restaurantStatus', {user: user, restaurant: restaurant.toJSON()});
            });

    }
});

router.get('/waiter/:id', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        var waiter_id = req.params.id;
        waiter_db_inf.getInfoAndRatingForManger({ waiter_id: waiter_id})
            .then(function(waiter){
                waiter.ratings_statistics = combineData.getRatingStatistics(waiter.all_ratings);
                res.render('manager/waiterInfo', { user: user, waiter: waiter});
            });

    }
});

// Export the module
module.exports = router;
