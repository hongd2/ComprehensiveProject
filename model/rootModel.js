var Q = require('q');
var DB = require('../db').DB,
    knex = DB.knex;

var Restaurant = DB.Model.extend({
    tableName: 'restaurants',
    idAttribute: 'restaurant_id',
    managers: function(){
        return this.belongsToMany(
            Manager,
            ['managers_manage_restaurant'],
            ['restaurant_id'],
            ['manager_id']);
    },
    all_waiters: function(){
        return this.belongsToMany(
            Waiter,
            ['current_waiters_work_restaurants'],
            ['restaurant_id'],
            ['waiter_id']);
    },
    current_shifts: function(){
        return this.hasMany(CurrentWaiterWorkShift, ['restaurant_id']);
    }
});

var WaiterRequestWorkRestaurant = DB.Model.extend({
    tableName: 'waiter_request_work_restaurant',
    idAttribute: 'request_id'
});

var WaiterWorkRestaurant = DB.Model.extend({
    tableName: 'waiters_work_restaurants',
    idAttribute: 'waiter_restaurant_id'
});

var Waiter = DB.Model.extend({
    tableName: 'users',
    idAttribute: 'user_id',
    waiter_info: function(){
        return this.hasOne(WaiterInfo, "waiter_id");
    },
    restaurants: function(){
        return this.belongsToMany(
            Restaurant,
            ['waiters_work_restaurants'],
            ['waiter_id'],
            ['restaurant_id']);
    },
    current_shift: function(){
        return this.belongsToMany(
            CurrentWaiterWorkShift,
            ['current_waiters_serve_tables'],
            ['waiter_id'],
            ['restaurant_id']);
    }
});

var WaiterInfo = DB.Model.extend({
    tableName: 'waiter_info',
    idAttribute: 'waiter_id'
});

var Diner = DB.Model.extend({
    tableName: 'users',
    idAttribute: 'user_id'
});

var Manager = DB.Model.extend({
    tableName: 'users',
    idAttribute: 'user_id',
    restaurants: function(){
        return this.belongsToMany(
            Restaurant,
            ['managers_manage_restaurant'],
            ['manager_id'],
            ['restaurant_id']);
    }
});

var ManagerManageRestaurant = DB.Model.extend({
    tableName: 'managers_manage_restaurant',
    idAttribute: 'management_id',
    restaurant: function(){
        return this.belongsTo(Restaurant);
    },
    manager: function(){
        return this.belongsTo(Manager);
    }
});


var CurrentWaiterWorkShift = DB.Model.extend({
    tableName: 'current_waiters_serve_tables',
    idAttribute: 'shift_id',
    waiter: function(){
        return this.belongsTo(Waiter, "waiter_id");
    },
    restaurant: function(){
        return this.belongsTo(Restaurant, "restaurant_id");
    }
});

var WaiterWorkShift = DB.Model.extend({
    tableName: 'waiters_serve_tables',
    idAttribute: 'shift_id',
    waiter: function(){
        return this.hasOne(Waiter, ["user_id"]);
    },
    restaurant: function(){
        return this.hasOne(Restaurant, ["restaurant_id"]);
    }
});

var DinerOccupyTable = DB.Model.extend({
    tableName: 'diner_occupy_table',
    idAttribute: 'occupy_id',
    diner: function(){
        return this.belongTo(Diner, 'diner_id');
    },
    restaurant: function(){
        return this.belongTo(Restaurant);
    }
});

var RatingReview = DB.Model.extend({
    tableName: 'diners_review_waiters',
    idAttribute: 'review_id',
    occupy: function(){
        return this.belongTo(Occupy);
    }
});

var DinerOccupyTableRequest = DB.Model.extend({
    tableName: 'diner_request_occupy_table',
    idAttribute: 'request_id'
});

var WatchResponse = DB.Model.extend({
    tableName: 'waiter_response_message',
    idAttribute: 'message_id'
});

var RatingAndWaiter = DB.Model.extend({
    tableName: 'ratings_and_waiter',
    idAttribute: null 
});

// --------------------------------------------------
// load enums from database into memory
// --------------------------------------------------
var allEnums = {};

function load_waiter_request_work_state(){

    var deferred = Q.defer();
    knex('waiter_request_work_state').select('*').then(function(states){
        allEnums.waiter_request_work_state = {};
        for (var i = 0; i < states.length; i++)
            allEnums.waiter_request_work_state[states[i].state] = states[i].id;
        deferred.resolve();
    });

    return deferred.promise.nodeify();
}

function load_diner_request_occupy_state(){

    var deferred = Q.defer();
    knex('diner_request_occupy_state').select('*').then(function(states){
        allEnums.diner_request_occupy_state = {};
        for (var i = 0; i < states.length; i++)
            allEnums.diner_request_occupy_state[states[i].state] = states[i].id;
        deferred.resolve();
    });

    return deferred.promise.nodeify();
}

function load_diner_review_type(){

    var deferred = Q.defer();
    knex('diner_review_type').select('*').then(function(types){
        allEnums.diner_review_type = {};
        for (var i = 0; i < types.length; i++)
            allEnums.diner_review_type[types[i].type] = types[i].id;
        deferred.resolve();
    });

    return deferred.promise.nodeify();
}


function loadAllEnums(){
    var deferred = Q.defer();
    // load enums for waiter_request_work_state
    load_waiter_request_work_state()
        .then(load_diner_review_type)
        .then(load_diner_request_occupy_state)
        .then(function(){
            deferred.resolve();
        });

    return deferred.promise.nodeify();
}

loadAllEnums();

module.exports = {
    allEnums : allEnums,
    Restaurant : Restaurant,
    WaiterRequestWorkRestaurant : WaiterRequestWorkRestaurant,
    WaiterWorkRestaurant : WaiterWorkRestaurant,
    Diner : Diner,
    Waiter : Waiter,
    Manager : Manager,
    ManagerManageRestaurant : ManagerManageRestaurant,
    WaiterWorkShift : WaiterWorkShift,
    RatingReview : RatingReview,
    DinerOccupyTable : DinerOccupyTable,
    DinerOccupyTableRequest : DinerOccupyTableRequest,
    WatchResponse : WatchResponse,
    RatingAndWaiter : RatingAndWaiter,
    WaiterInfo : WaiterInfo
};
