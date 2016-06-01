var express = require('express');
var router = express.Router();
var path = require('path');
var rootModel = require(path.resolve(__dirname, '..', '..', 'model', 'rootModel.js'));
var diner_db_inf = require('../../model/dinerDbInf.js');
var rest_db_inf = require('../../model/restaurantDbInf.js');
var waiter_db_inf = require('../../model/waiterDbInf.js');
var rating_db_inf = require('../../model/ratingDbInf.js');
var occupy_db_inf = require('../../model/occupyDbInf.js');
var waiter_work_db_inf = require('../../model/waiterWorkDbInf.js');
var my_errno = require('../../lib/my_errno');
var gcm_driver = require('../../gcm_driver');
var Q = require('q');


router.post('/api/askToWorkAtRestaurant', function(req, res, next){
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        var requestInfo = req.body;

        // check if this waiter already worked at this restaurant
        waiter_db_inf.checkWaiterNotWorkRestaurant({
            user_id: user.user_id, 
            restaurant_id: requestInfo.restaurant_id
        }).then(function(work_relations){
            // console.log("--------------------------------------------------");
            // console.log(work_relations);
            if (work_relations === null){
                // this waiter doesn't already work here
                // add a new row to table of request to work
                waiter_work_db_inf.createNewWorkRequest({
                    waiter_id: user.user_id, 
                    restaurant_id: requestInfo.restaurant_id
                }).then(function(insertedRequest){
                    res.status(200).type('json').send(JSON.stringify(insertedRequest));
                }).catch(function(err){
                    res.status(400).type('json').send(JSON.stringify({}));
                });
            } else {
                res.status(400).type('json').send(JSON.stringify({errorMessage: "This waiter already worked at this restaurant"}));
            }
        }).catch(function(err){
            next(new my_errno.UserError(err.message));
        });
    }
});


router.get('/api/waiterGetListWorkRestaurant', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        waiter_db_inf
            .getWaiterWorkRestaurant({
                waiter_id: req.user.user_id
            }).then(function(restaurants){
                res.status(200).type('json').send(
                    JSON.stringify({
                        restaurants: restaurants
                    }));
        });
    }
});


router.post('/api/waiterStartShift', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).type('json').send();
    } else {
        var request_data = req.body;
        waiter_db_inf.startWaiterShift({
            waiter_id: req.user.user_id,
            restaurant_id: request_data.restaurant_id,
            table_number: request_data.table_number.split(',')
            }).then(function(newShift){
                if (newShift === null)
                    res.status(400).type('json').send({});
                else
                    res.status(200).type('json').send({shift_id: newShift.toJSON().shift_id});
            });
    }
});

router.post('/api/waiterCloseShift', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.status(401).type('json').send();
    } else {
        var request_data = req.body;
        waiter_db_inf.closeWaiterShift({
            waiter_id: req.user.user_id,
            shift_id: request_data.shift_id
            }).then(function(){
                res.status(200).type('json').send({});
            }).catch(function(e){
                res.status(400).type('json').send({});   
            });
    }
});

router.get('/api/waiterGetOpenShift', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var request_data = req.body;
        waiter_db_inf.getWaiterOpenShift({
            waiter_id: req.user.user_id
            }).then(function(shifts){
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({
                    shifts: shifts.toJSON()
                    }));
            });

    }
});

router.post('/api/waiterChangeServingTable', function(req, res, next){
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var request_data = req.body;
        waiter_db_inf.changeWaiterServeTable({
            waiter_id: req.user.user_id,
            shift_id: request_data.shift_id,
            table_number: request_data.table_number.split(','),
            }).then(function(modifiedShift){
                if (modifiedShift !== null) {
                    res.status(200).send(JSON.stringify({}));
                } else {
                    res.status(400).send(JSON.stringify({}));
                }
            });

    }
});

router.get('/api/getRatingDetail', function(req, res, next){
    if (!req.isAuthenticated()) {
        next(new my_errno.UserError("Fail authentication"));
    } else {
        rating_db_inf.getWaiterRatingDetailTypeWaiterAndPublic({
            waiter_id: req.user.user_id
        }).then(function(rating){
            res.status(200).type("json")
                .send(JSON.stringify({ratings: rating.toJSON()}));
        }).catch(function(err){
            next(new my_errno.UserError(err.message));
        });
    }
});


function notifyDinerRequestDecision(req, callback){
    var deferred = Q.defer();
    req.type = "decideDinerRequestOccupy";
    gcm_driver.sendGcmMessage(req.diner_id, req)
        .then(function(){
            deferred.resolve();
        });

    return deferred.promise.nodeify(callback);
}

router.post('/api/waiterDecideOccupyRequest', function(req, res, next){
    if (!req.isAuthenticated()) {
        next(new my_errno.UserError("Fail authentication"));
    } else {
        var request_data = req.body;
        // make decision on the wa
        occupy_db_inf.decideOccupyRequest({
            // waiter_id: req.user.user_id,
            request_id: request_data.request_id,
            state: request_data.decision
        }).then(function(modifiedRequestArr){
            modifiedRequest = modifiedRequestArr[0];
            if (modifiedRequestArr.length > 0) {
                // add this occupy to diner_occupy_table
                occupy_db_inf.createNewOccupy({
                    restaurant_id: modifiedRequest.restaurant_id,
                    diner_id: modifiedRequest.diner_id,
                    table_number: modifiedRequest.table_number
                }).then(function(newOccupy){
                    notifyDinerRequestDecision({
                        diner_id: modifiedRequest.diner_id,
                        decision: 0,
                        occupy_id: newOccupy.toJSON().occupy_id
                    }).then(function(){
                        res.status(200).send(JSON.stringify(newOccupy.toJSON()));
                    });
                });
            } else {
                notifyDinerRequestDecision({
                    diner_id: modifiedRequest.diner_id,
                    decision: 1,
                    occupy_id: 0
                }).then(function(){
                    res.status(200).send(JSON.stringify({}));
                });
            }
        }).catch(function(err){
            next(new my_errno.UserError(err.message));
        });
    }
});

// **************************************************
// API to let waiter customize their responses from watch buttons
// CREATE is not necessary because we assign default response when waiter registers
// READ
router.get('/api/waiter/watchResponse', function(req, res, next){
    if (!req.isAuthenticated()) {
        next(new my_errno.UserError("Fail authentication"));
    } else {
        var user = req.user;
        waiter_db_inf.readWaiterWatchResponse({waiter_id: user.user_id})
            .then(function(responses){
                res.status(200).send(JSON.stringify({
                    responses:  responses
                }));
            }).catch(function(err){
                next(err);
            });
    }
});

// UPDATE
router.put('/api/waiter/watchResponse/:type', function(req, res, next){
    if (!req.isAuthenticated()) {
        next(new my_errno.UserError("Fail authentication"));
    } else {
        var user = req.user;
        waiter_db_inf.updateWaiterWatchResponse({
            waiter_id: user.user_id,
            message_type: req.params.type,
            message: req.body.message,
            char_key: req.body.char_key
        }).then(function(result){
            res.status(200).send("");
        }).catch(function(err){
            next(err);
        });
    }
});
// **************************************************
module.exports = router;
