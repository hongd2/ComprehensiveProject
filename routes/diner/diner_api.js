var Q = require('q');
var express = require('express');
var my_errno  = require('../../lib/my_errno');
var router = express.Router();
var diner_db_inf = require('../../model/dinerDbInf.js');
var rest_db_inf = require('../../model/restaurantDbInf.js');
var waiter_db_inf = require('../../model/waiterDbInf.js');
var rating_db_inf = require('../../model/ratingDbInf.js');
var occupy_db_inf = require('../../model/occupyDbInf.js');
var gcm_driver = require('../../gcm_driver');

router.get('/api/getRestaurantInfoById', function(req, res, next){
    // If user is not authenticated, reject connection
    if (!req.isAuthenticated()) {
        res.status(401).send("");
    } else {
        var user = req.user;
        var requestInfo = req.query;
        // get restaurant info based on the id
        rest_db_inf.getRestaurantInfoById({
            restaurant_id: parseInt(requestInfo.restaurant_id)
        }).then(function(restaurant_info){
            if (restaurant_info === null){
                res.status(400).send("");
            } else {
                var result = restaurant_info.toJSON();
                res.status(200).type('json').send(JSON.stringify(result));
            }
        });
    }
});

router.get('/api/getWaiterServingInfo', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).send();
    } else {
        var requestInfo = req.query;
        // assume youhave requestInfo.restaurantId and requestInfo.tableNumber
        waiter_db_inf.getWaiterServingInfo(requestInfo).then(function(waiters){
            res.status(200).type("json").send(JSON.stringify({waiters:waiters}));
        });
    }
});

router.post('/api/dinerRateReviewService', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).send();
    } else {
        var requestInfo = req.body;
        // add diner_id into requestInfo
        requestInfo.diner_id = req.user.user_id;
        rating_db_inf.createNewRating(requestInfo)
            .then(function(newrRating){
                res.status(200).type("json").send(JSON.stringify({}));
            }).catch(function(err){
                next(new my_errno.UserError(err.message));
            });
    }
});


function notifyWaiterToApprove(req, callback){
    var deferred = Q.defer();
    waiter_db_inf.getWaiterServingInfo(req)
        .then(function(waiter_info){
            // console.log("notifyWaiterToApprove", waiter_info);
            waiter_info = waiter_info[0];
            gcm_driver.sendGcmMessage(waiter_info.waiter_id,
                {
                    type: "showDinerRequestOccupy",
                    request_id: parseInt(req.request_id),
                    table_number: parseInt(req.table_number),
                    username: req.username
                }).then(function(){
                    deferred.resolve(req.request_id);
                });
        })

    return deferred.promise.nodeify(callback);
}

router.post('/api/dinerRequestOccupyTable', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).send();
    } else {
        var requestInfo = req.body;
        // add diner_id into requestInfo
        requestInfo.diner_id = req.user.user_id;
        var newOccupyRequestSave = null;
        occupy_db_inf.createNewOccupyRequest(requestInfo)
            .then(function(newOccupyRequest){
                // console.log('dinerRequestOccupyTable', {
                //     restaurant_id: requestInfo.restaurant_id, 
                //     table_number: requestInfo.table_number, 
                //     request_id: newOccupyRequest.toJSON().request_id, 
                //     username: req.user.local.username
                // });
                newOccupyRequestSave = newOccupyRequest;
                notifyWaiterToApprove({
                    restaurant_id: requestInfo.restaurant_id, 
                    table_number: requestInfo.table_number, 
                    request_id: newOccupyRequest.toJSON().request_id, 
                    username: req.user.local.username
                }).then(function(){
                    res.status(200).type("json")
                        .send(JSON.stringify(newOccupyRequestSave));
                });
            }).catch(function(err){
                next(new my_errno.UserError(err.message));
            });
    }
});


router.post('/api/dinerEndOccupyTable', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).send();
    } else {
        var requestInfo = req.body;
        // add diner_id into requestInfo
        requestInfo.diner_id = req.user.user_id;
        occupy_db_inf.endOccupy(requestInfo)
            .then(function(endedOccupy){
                res.status(200).type("json").send(JSON.stringify({}));
            }).catch(function(err){
                next(new my_errno.UserError(err.message));
            });
    }
});

module.exports = router;
