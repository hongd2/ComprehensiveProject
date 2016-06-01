var gcm = require('node-gcm');
var config = require('./config');
var redisClient = require('./redis/redis_client');
var Q = require('q');

function sendGcmMessage(user_id, payload, callback){

    var deferred = Q.defer();
    redisClient.getAndroidClient({
        user_id: user_id
    }).then(function(devices){
        if (devices !== null && devices.length > 0){
            var message = new gcm.Message();
            message.addData(payload);
            var regTokens = devices;
            // Set up the sender with you API key
            var sender = new gcm.Sender(config.google.gcm_api_key);

            // Now the sender can be used to send messages
            sender.send(message, { registrationTokens: regTokens }, function (err, result) {
                if(err) console.log(err);
                deferred.resolve();
            });

            // Send to a topic, with no retry this time
            // sender.sendNoRetry(message, 
            //         { topic: '/topics/global', 
            //         registrationTokens: regTokens }, 
            //     function (err, result) {
            //         if(err) console.error(err);
            //         else    console.log(result);
            //     });
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise.nodeify(callback);

}
    

module.exports = {
    sendGcmMessage : sendGcmMessage
}

