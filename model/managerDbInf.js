var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));
var allEnums = rootModel.allEnums;

// use promise here to support .then()
function getManagerWithRestaurants(req, callback){
    var deferred = Q.defer();
    rootModel.Manager.where({user_id: req.manager_id, manager_flag: true})
        .fetch({withRelated: ['restaurants']})
        .then(function(manager){
            deferred.resolve(manager);
        });
    return deferred.promise.nodeify(callback);
}

function getManagerWithAllWaiters(req, callback){
    var deferred = Q.defer();
    rootModel.Manager.where({user_id: req.manager_id, manager_flag: true})
        .fetch({withRelated: ['restaurants.all_waiters.waiter_info']})
        .then(function(manager){
            deferred.resolve(manager);
        });
    return deferred.promise.nodeify(callback);
}

function checkWaiterNotWorkRestaurant(req, callback){
    var deferred = Q.defer();
    rootModel.WaiterWorkRestaurant.where({
        waiter_id: req.user_id,
        restaurant_id: req.restaurant_id})
        .fetchAll().then(
            function(work_relations){
                deferred.resolve(work_relations);
            });
    return deferred.promise.nodeify(callback);
}

// this query too hard to do in bookshelf.js
// must use SQL
function getPendingWorkRequest(req, callback){
    var deferred = Q.defer();

    knex.select(
        'waiter_request_work_restaurant.request_id',
        'waiters.username as waiter_username',
        'waiter_request_work_restaurant.restaurant_id')
        .from('waiter_request_work_restaurant')
        .innerJoin(
            'users as waiters',
            'waiter_request_work_restaurant.waiter_id',
            'waiters.user_id')
        .innerJoin(
            'managers_manage_restaurant',
            'waiter_request_work_restaurant.restaurant_id',
            'managers_manage_restaurant.restaurant_id')
        .where('managers_manage_restaurant.manager_id', '=', req.user_id)
        .andWhere(
            'waiter_request_work_restaurant.state' ,
            '=',
            allEnums.waiter_request_work_state.pending)
        .then(function(requests){
            deferred.resolve(requests);
        });

    return deferred.promise.nodeify(callback);
}

function addNewRestaurantManagement(req, callback){

    var deferred = Q.defer();

    new rootModel.ManagerManageRestaurant({
        restaurant_id:  req.restaurant_id,
        manager_id: req.manager_id
    }).save({}, {method: 'insert'})
    .then(function(newManagement) {

        deferred.resolve(newManagement);
    }).catch(function(err){
        console.error(err);
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
}

module.exports = {
    getManagerWithRestaurants : getManagerWithRestaurants,
    checkWaiterNotWorkRestaurant : checkWaiterNotWorkRestaurant,
    getPendingWorkRequest    : getPendingWorkRequest,
    addNewRestaurantManagement : addNewRestaurantManagement,
    getManagerWithAllWaiters: getManagerWithAllWaiters
};
