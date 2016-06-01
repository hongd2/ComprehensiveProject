var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));

function createNewRating(req, callback){

    var deferred = Q.defer();

    new rootModel.RatingReview({
        diner_id: req.diner_id,
        occupy_id:  req.occupy_id, 
        review: req.review, 
        rating: req.rating, 
        review_type: req.type,
        time: new Date()
    }).save().then(function(newRating){
        deferred.resolve(newRating);
    });

    return deferred.promise.nodeify(callback);
}


function getWaiterRatingDetailTypeWaiterAndPublic(req, callback){
    var deferred = Q.defer();

    rootModel.RatingAndWaiter.query(function(qb){
        qb.where('waiter_id', '=', req.waiter_id)
        .andWhere(function(){
            this.where('review_type', '=', 3)
            .orWhere('review_type', '=', 1)
        });
    }).fetchAll().then(function(ratings){
        deferred.resolve(ratings);
    });

    return deferred.promise.nodeify(callback);
}


function getWaiterRatingDetailTypeManagerAndPublic(req, callback){
    var deferred = Q.defer();

    rootModel.RatingAndWaiter.query(function(qb){
        qb.where('waiter_id', '=', req.waiter_id)
        .andWhere(function(){
            this.where('review_type', '=', 3)
            .orWhere('review_type', '=', 2)
        });
    }).fetchAll().then(function(ratings){
        deferred.resolve(ratings);
    });

    return deferred.promise.nodeify(callback);
}

module.exports = {
    createNewRating: createNewRating,
    getWaiterRatingDetailTypeManagerAndPublic: getWaiterRatingDetailTypeManagerAndPublic,
    getWaiterRatingDetailTypeWaiterAndPublic: getWaiterRatingDetailTypeWaiterAndPublic
};
