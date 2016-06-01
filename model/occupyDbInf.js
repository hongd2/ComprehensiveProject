var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));

function createNewOccupyRequest(req, callback){

    var deferred = Q.defer();

    new rootModel.DinerOccupyTableRequest({
        restaurant_id:  parseInt(req.restaurant_id), 
        diner_id: parseInt(req.diner_id), 
        table_number: parseInt(req.table_number), 
        state: rootModel.allEnums.diner_request_occupy_state.pending,
        request_time_stamp: new Date()
    }).save().then(function(newOccupyRequest){
        deferred.resolve(newOccupyRequest);
    });

    return deferred.promise.nodeify(callback);
}

function createNewOccupy(req, callback){

    var deferred = Q.defer();

    new rootModel.DinerOccupyTable({
        restaurant_id:  parseInt(req.restaurant_id), 
        diner_id: parseInt(req.diner_id), 
        table_number: parseInt(req.table_number), 
        start_time: new Date()
    }).save().then(function(newOccupy){
        deferred.resolve(newOccupy);
    });

    return deferred.promise.nodeify(callback);
}

function getOccupyRequest(req, callback){

    var deferred = Q.defer();

    new rootModel.DinerOccupyTableRequest({
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

function decideOccupyRequest(req, callback){

    var deferred = Q.defer();

    knex('diner_request_occupy_table')
        .where({
            request_id: req.request_id,
            state: rootModel.allEnums.diner_request_occupy_state.pending
        }).update({
            state: req.state,
            decision_time_stamp : new Date()
        }).returning(['request_id', 'state', 'diner_id', 'restaurant_id', 'table_number'])
        .then(function(modifiedRequest){
            deferred.resolve(modifiedRequest);
        })
        .catch(function(err){
            console.log(err);
            deferred.reject(err);
        });

    return deferred.promise.nodeify(callback);
}

function endOccupy(req, callback){

    var deferred = Q.defer();

    new rootModel.DinerOccupyTable({
        diner_id: req.diner_id,
        occupy_id: parseInt(req.occupy_id)
    }).save({
        end_time: new Date()
    }).then(function(newOccupy){
        deferred.resolve(newOccupy);
    });

    return deferred.promise.nodeify(callback);
}


module.exports = {
    createNewOccupyRequest : createNewOccupyRequest,
    decideOccupyRequest: decideOccupyRequest,
    endOccupy : endOccupy,
    createNewOccupy : createNewOccupy,
    getOccupyRequest : getOccupyRequest
};
