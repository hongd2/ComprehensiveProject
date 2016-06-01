// So far let's put all redis interactions into this file
// In the future, if we need we can refactor this file furter

var Q = require('q');
var redis = require('redis');
var config = require('../config');
var client = redis.createClient({
    host: config.redis.host,
    port: config.redis.port    
}); //creates a new client

client.on('connect', function() {
    console.log('connected to Redis server');
});

function setAndroidClient(req, callback){
    var deferred = Q.defer();
    client.sadd(["and-dev-usr-" + req.user_id, req.android_token], function(err, reply){
        if (!err){    
            deferred.resolve(reply);
        } else {
            deferred.reject(err);
        }
    });
    return deferred.promise.nodeify(callback);
}

function getAndroidClient(req, callback){
    var deferred = Q.defer();
    client.smembers("and-dev-usr-" + req.user_id, function(err, devices){
        if (!err){    
            deferred.resolve(devices);
        } else {
            deferred.reject(err);
        }
            
    });
    return deferred.promise.nodeify(callback);
}

function unsetAndroidClient(req){
    client.srem("and-dev-usr-" + req.user_id, req.android_token);
}

// This store the list of path that is public or private instead of keeping to calculate them
function setPathMemory(url, type){
    var deferred = Q.defer();
    var setname = type === "public" ? "public-path" : "private-path";
    client.sadd([setname, url], function(err, reply){
        if (!err){    
            deferred.resolve(reply);
        } else {
            deferred.reject(err);
        }
    });
    return deferred.promise.nodeify();
}

// This check the public and private path list to see if it is already classified 
function checkClassifiedPath(url){
    var deferred = Q.defer();
    client.sismember(["public-path", url], function(err, reply){
        if (!err){    
            if (reply === 1)
                deferred.resolve("public");
            else
                client.sismember(["private-path", url], function(err, reply){
                    if (!err){    
                        if (reply === 1)
                            deferred.resolve("private");
                        else
                            deferred.resolve("none");
                    } else {
                        deferred.reject(err);
                    }
                });
        } else {
            deferred.reject(err);
        }
    });
    return deferred.promise.nodeify();
}


module.exports = {
    setAndroidClient : setAndroidClient,
    unsetAndroidClient : unsetAndroidClient,
    getAndroidClient : getAndroidClient,
    setPathMemory : setPathMemory,
    checkClassifiedPath : checkClassifiedPath
};

