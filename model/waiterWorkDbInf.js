var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));

function createNewWorkRequest(req, callback){

    var deferred = Q.defer();
    var newRequest = new rootModel.WaiterRequestWorkRestaurant({ 
        waiter_id: req.waiter_id, 
        restaurant_id: req.restaurant_id, 
        state: rootModel.allEnums.waiter_request_work_state.pending, 
        request_time_stamp: new Date()});

    newRequest.save({}, {method: 'insert'}).then(
        function(insertedRequest) {
            deferred.resolve(insertedRequest);
        }, function(err){
            throw (err);
        });

    return deferred.promise.nodeify(callback);
}

function createNewWork(req, callback){

    var deferred = Q.defer();

    new rootModel.WaiterWorkRestaurant({
        restaurant_id:  parseInt(req.restaurant_id), 
        waiter_id: parseInt(req.waiter_id), 
        start_time: new Date()
    }).save().then(function(newWork){
        deferred.resolve(newWork);
    });

    return deferred.promise.nodeify(callback);
}

function getWorkRequest(req, callback){

    var deferred = Q.defer();

    new rootModel.WaiterRequestWorkRestaurant({
        request_id: req.request_id
    }).fetch()
    .then(function(occupyRequest){
        deferred.resolve(occupyRequest);
    })
    .catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
}

function getWork(req, callback){

    var deferred = Q.defer();
    new rootModel.WaiterWorkRestaurant({
        waiter_id: req.waiter_id
    }).fetchAll()
    .then(function(allWorks){
        deferred.resolve(allWorks);
    })
    .catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
}


// TO DO: check the request_id and user_id 
// to see if this manager is responsible for this request 
// through the restaurants
//
// Apparently using Bookshelf alone won't be able to do UPDATE ... WHERE state = 1
// So I just have to use knex
function decidePendingWorkRequest(req, callback){
    var deferred = Q.defer();

    knex('waiter_request_work_restaurant')
        .where({
            request_id: req.request_id,
            state: rootModel.allEnums.waiter_request_work_state.pending
        }).update({
            state: req.state,
            decision_time_stamp : new Date()
        }).returning(['request_id', 'state', 'waiter_id', 'restaurant_id'])
        .then(function(modifiedRequest){
            deferred.resolve(modifiedRequest);
        })
        .catch(function(err){
            console.log(err);
            deferred.reject(err);
        });

    return deferred.promise.nodeify(callback);
}

function endWork(req, callback){

    var deferred = Q.defer();

    new rootModel.WaiterWorkTableRequest({
        diner_id: req.diner_id,
        occupy_id: parseInt(req.occupy_id)
    }).save({
        end_time: new Date()
    }).then(function(newWork){
        deferred.resolve(newWork);
    });

    return deferred.promise.nodeify(callback);
}


module.exports = {
    createNewWorkRequest : createNewWorkRequest,
    decidePendingWorkRequest: decidePendingWorkRequest,
    getWorkRequest : getWorkRequest,
    createNewWork : createNewWork,
    getWork : getWork
};
