var express = require('express');
var router = express.Router();

var diner_db_inf = require('../../model/dinerDbInf.js');
var rest_db_inf = require('../../model/restaurantDbInf.js');
var manager_db_inf = require('../../model/managerDbInf.js');
var waiter_work_db_inf = require('../../model/waiterWorkDbInf.js');
var rootModel = require('../../model/rootModel.js');
var fs = require('fs');
var AWS = require('aws-sdk');
var config = require('../../config');
AWS.config.update({ accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_S3_ACCESS_KEY });

router.get('/api/restaurantStatus', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        // get list of all restaurants of this manager
        manager_db_inf.getManagerWithRestaurants({
            manager_id: user.user_id
        }).then(function(manager){
            res.status(200).type('json').send(JSON.stringify({
                restaurants: manager.toJSON().restaurants
            }));
        });
    }
});


router.get('/api/getAvailableRestaurants', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        // get list of all restaurants of this manager
        rest_db_inf.getRestaurantWaiterDontWork({waiter_id: user.user_id}).then(function(restaurants){
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({ restaurants: restaurants}));
        });
    }
});

router.get('/api/getPendingWorkRequest', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        manager_db_inf.getPendingWorkRequest({user_id: user.user_id}).then(
            function(pending_requests){
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({
                    requests: pending_requests
                }));
            });

    }
});

router.post('/api/decidePendingWorkRequest', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {

        var requestInfo = req.body;
        // decide on the request
        waiter_work_db_inf.decidePendingWorkRequest({
            request_id: requestInfo.request_id,
            state: requestInfo.state
        }).then(function(modifiedWorkRequest){
            modifiedWorkRequest = modifiedWorkRequest[0];
            if (modifiedWorkRequest.state === rootModel.allEnums.waiter_request_work_state.approved){
                // add new waiter work restaurant relationship
                waiter_work_db_inf.createNewWork({
                    waiter_id: modifiedWorkRequest.waiter_id,
                    restaurant_id: modifiedWorkRequest.restaurant_id
                }).then(function(newWork){
                    res.status(200).type('json').send(JSON.stringify(newWork.toJSON()));
                });
            } else {
                res.status(200).type('json').send(JSON.stringify({}));
            }
        });
    }

});

// Export the module
module.exports = router;
