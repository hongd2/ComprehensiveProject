var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));
var allEnums = rootModel.allEnums;

function createNewRestaurant(req, callback) {
    var deferred = Q.defer();
    new rootModel.Restaurant({
            name: req.name,
            address: req.address,
            num_table: req.num_table,
            picture: req.picture
        }).save().then(function(restaurant) {
            deferred.resolve(restaurant);
        });

    return deferred.promise.nodeify(callback);
}

// this query is very simple to do from SQL but harder from bookshelf
function getAllRestaurantId(req, callback){

    var deferred = Q.defer();
    knex.select("restaurant_id")
        .from('restaurants')
        .then(function(rows){
            deferred.resolve(rows);
        });
    return deferred.promise.nodeify(callback);
}

function getRestaurantInfoById(req, callback) {
    var deferred = Q.defer();

    rootModel.Restaurant
        .where('restaurant_id', req.restaurant_id)
        .fetch()
        .then(function(row){
            deferred.resolve(row);
        });

    return deferred.promise.nodeify(callback);
}

// this query too hard to do in bookshelf.js
// must use SQL
function getRestaurantWaiterDontWork(req, callback){
    var deferred = Q.defer();

    var subquery =
        knex.select('restaurant_id')
        .from('waiters_work_restaurants')
        .where('waiter_id', req.waiter_id);

    knex('restaurants').select('*')
        .where('restaurant_id', 'not in', subquery)
        .then(function(res){
            deferred.resolve(res);
        });


    return deferred.promise.nodeify(callback);
}

function getFullStatus(req, callback){

    var deferred = Q.defer();

    rootModel.Restaurant.where({restaurant_id: req.restaurant_id})
        .fetch({withRelated: ['managers', 'all_waiters', 'current_shifts.waiter']})
        .then(function(restaurant){
            deferred.resolve(restaurant);
        });
    return deferred.promise.nodeify(callback);
}

function getAllWaiters(req, callback){

    var deferred = Q.defer();

    rootModel.Restaurant.where({restaurant_id: req.restaurant_id})
        .fetch({withRelated: ['all_waiters']})
        .then(function(restaurant){
            deferred.resolve(restaurant);
        });
    return deferred.promise.nodeify(callback);
}

module.exports = {
    createNewRestaurant : createNewRestaurant,
    getRestaurantInfoById    : getRestaurantInfoById,
    getRestaurantWaiterDontWork    : getRestaurantWaiterDontWork,
    getAllRestaurantId : getAllRestaurantId,
    getFullStatus : getFullStatus
};
