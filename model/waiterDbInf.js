var Q = require('q');
var DB = require('../db').DB;
var knex = DB.knex;
var path = require('path');
var rootModel = require(path.resolve(__dirname, 'rootModel.js'));
var rating_db_inf = require(path.resolve(__dirname, 'ratingDbInf.js'));
var my_errno = require('../lib/my_errno');

var allEnums = rootModel.allEnums;

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

function checkWaiterNotWorkRestaurant(req, callback){
    var deferred = Q.defer();
    new rootModel.WaiterWorkRestaurant({
        waiter_id: req.user_id,
        restaurant_id: req.restaurant_id,
        end_time: null
    }).fetch()
    .then(function(work_relations){
        // console.log(work_relations);
        deferred.resolve(work_relations);
    });
    return deferred.promise.nodeify(callback);
}


function getWaiterWorkRestaurant(req, callback){

    var deferred = Q.defer();

    rootModel.Waiter
        .where({user_id: req.waiter_id, waiter_flag: true})
        .fetch({withRelated: ['restaurants']})
        .then(function(waiter){
            deferred.resolve(waiter.related('restaurants').toJSON());
        });

    return deferred.promise.nodeify(callback);
}

function startWaiterShift(req, callback){

    var deferred = Q.defer();

    new rootModel.WaiterWorkShift({
        waiter_id:  req.waiter_id,
        restaurant_id: req.restaurant_id,
        table_number: req.table_number,
        serve_start_time: new Date()
    }).save().then(function(newShift){
        deferred.resolve(newShift);
    });

    return deferred.promise.nodeify(callback);
}

function closeWaiterShift(req, callback){

    var deferred = Q.defer();

    new rootModel.WaiterWorkShift({
        waiter_id:  req.waiter_id,
        shift_id: req.shift_id
    }).save({
        serve_end_time: new Date()
    }).then(function(closedShift){
        deferred.resolve(closedShift);
    });

    return deferred.promise.nodeify(callback);
}

function getWaiterOpenShift(req, callback){

    var deferred = Q.defer();

    rootModel.WaiterWorkShift
    .where({
        waiter_id:  req.waiter_id,
        serve_end_time: null
    }).fetchAll().then(function(shift){
        deferred.resolve(shift);
    });

    return deferred.promise.nodeify(callback);
}

function changeWaiterServeTable(req, callback){
    var deferred = Q.defer();


    new rootModel.WaiterWorkShift({
        waiter_id:  req.waiter_id,
        serve_end_time: null,
        shift_id: req.shift_id
    }).save({
        table_number: req.table_number
    }).then(function(shift){
        deferred.resolve(shift);
    });

    return deferred.promise.nodeify(callback);

}

// this query is too tough to do in Bookshelf
function getWaiterServingInfo(req, callback){
    var deferred = Q.defer();
	knex.select('waiter_info.waiter_id', 'waiter_pic', 'waiter_name', 'waiter_profile')
		.from('waiter_info')
		.innerJoin('current_waiters_serve_tables', 'waiter_info.waiter_id', 'current_waiters_serve_tables.waiter_id')
		.andWhere('restaurant_id', '=', req.restaurant_id)
		.andWhereRaw('? = ANY(table_number)', [req.table_number])
		.then(function(rows){
			deferred.resolve(rows);
		});
    return deferred.promise.nodeify(callback);

}

function appendRatingsToWaiterForManager(waiter){

    var deferred = Q.defer();
    // console.log("input = ", waiter);
    rating_db_inf.getWaiterRatingDetailTypeManagerAndPublic({
        waiter_id: waiter.toJSON().user_id
    }).then(function(all_ratings){
        waiter = waiter.toJSON();
        waiter['all_ratings'] = all_ratings.toJSON();
        deferred.resolve(waiter);
    });
    return deferred.promise.nodeify();
}


function appendRatingsToWaiterForWaiter(waiter){

    var deferred = Q.defer();
    // console.log("input = ", waiter);
    rating_db_inf.getWaiterRatingDetailTypeWaiterAndPublic({
        waiter_id: waiter.toJSON().user_id
    }).then(function(all_ratings){
        waiter = waiter.toJSON();
        waiter['all_ratings'] = all_ratings.toJSON();
        deferred.resolve(waiter);
    });
    return deferred.promise.nodeify();
}

function getInfoAndRatingForWaiter(req){

    var deferred = Q.defer();

        rootModel.Waiter.where({
            user_id:  req.waiter_id
        }).fetch({withRelated: "waiter_info"})
        .then(appendRatingsToWaiterForWaiter)
        .then(function(waiter){
            deferred.resolve(waiter);
            // console.log('got here');
        });
    return deferred.promise.nodeify();
}

function getInfoAndRatingForManger(req){

    var deferred = Q.defer();

        rootModel.Waiter.where({
            user_id:  req.waiter_id
        }).fetch({withRelated: "waiter_info"})
        .then(appendRatingsToWaiterForManager)
        .then(function(waiter){
            deferred.resolve(waiter);
            // console.log('got here');
        });
    return deferred.promise.nodeify();
}

function updateWaiterProfile(req){
    var deferred = Q.defer();

        rootModel.WaiterInfo.forge({
            waiter_id:  req.waiter_id
        }).fetch({require: true})
        .then(function(waiterProfile){
            waiterProfile.save({
                waiter_name: req.waiter_name,
                waiter_pic: req.waiter_pic,
                waiter_profile: req.waiter_profile
            }).then(function(newProfile){
                deferred.resolve(newProfile);
            }).catch(function(err){
                deferred.reject(err);   
            });
        }).catch(function(err){
            deferred.reject(err);   
        });
    return deferred.promise.nodeify();
}

// **************************************************
// database access to let waiter customize their responses from watch buttons
// CREATE
function createDefaultWatchResponse(waiterWorkRecord){
    waiterWorkRecord = waiterWorkRecord.toJSON();

    var defaultResponses = [
        { message_type: 1, message: "I'll get it", char_key: "G"},
        { message_type: 2, message: "Hang on I'm busy", char_key: "B"},
        { message_type: 3, message: "OK", char_key: "K"}
    ];

    return Q.all(defaultResponses.map(function(resp){
        return createDefaultWatchResponseByType({
            waiter_id: waiterWorkRecord.waiter_id,
            message_type: resp.message_type,
            message: resp.message,
            char_key: resp.char_key
        });
    }));

}

function createDefaultWatchResponseByType(req){
    var deferred = Q.defer();

    new rootModel.WatchResponse({
        waiter_id: req.waiter_id,
        message_type: req.message_type,
        message: req.message,
        char_key: req.char_key
    }).save()
    .then(function(responses){
        deferred.resolve(responses);
    }).catch(function(err){
        console.error(err);
        deferred.reject(new my_errno.UserError("Can't create new watch response"));
    });

    return deferred.promise.nodeify();
}

// READ
function readWaiterWatchResponse(req){
    var deferred = Q.defer();
    rootModel.WatchResponse.where({
        waiter_id: req.waiter_id
    }).fetchAll()
    .then(function(responses){
        deferred.resolve(responses);
    }).catch(function(err){
        deferred.reject(new my_errno.UserError("Can't get watch response"));
    });

    return deferred.promise.nodeify();
}

// UPDATE
function updateWaiterWatchResponse(req){
    var deferred = Q.defer();

    rootModel.WatchResponse.forge({
        waiter_id: req.waiter_id,
        message_type: req.message_type
    }).fetch({require: true})
    .then(function(watchResponse){
        watchResponse.save({
            char_key: req.char_key,
            message: req.message
        }).then(function(watchResponse){
            deferred.resolve(watchResponse);
        }).catch(function(err){
            deferred.reject(err);
        });
    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise.nodeify();
}
// **************************************************

module.exports = {
    getRestaurantWaiterDontWork : getRestaurantWaiterDontWork,
    checkWaiterNotWorkRestaurant : checkWaiterNotWorkRestaurant,
    getWaiterWorkRestaurant  : getWaiterWorkRestaurant,
    startWaiterShift         : startWaiterShift,
    getWaiterOpenShift       : getWaiterOpenShift,
    changeWaiterServeTable   : changeWaiterServeTable,
    closeWaiterShift         : closeWaiterShift,
    getWaiterServingInfo    : getWaiterServingInfo,
    getInfoAndRatingForManger  : getInfoAndRatingForManger,
    getInfoAndRatingForWaiter : getInfoAndRatingForWaiter,
    createDefaultWatchResponse : createDefaultWatchResponse,
    readWaiterWatchResponse : readWaiterWatchResponse,
    updateWaiterWatchResponse : updateWaiterWatchResponse,
    updateWaiterProfile : updateWaiterProfile
};
