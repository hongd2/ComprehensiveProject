var express = require('express'),
    redisClient = require('../redis/redis_client.js'), router = express.Router();


router.post('/api/registerAndroidDevice', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.status(401).send("{}");
    } else {
        var user = req.user;
        redisClient.setAndroidClient({
            user_id: user.user_id,
            android_token: req.body.android_token
        })
        .then(function(devices){
            res.status(200).send("{}");
        });
    }

});

router.post('/api/delistAndroidDevice', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.status(401).send("{}");
    } else {
        var user = req.user;
        redisClient.unsetAndroidClient({
            user_id: user.user_id,
            android_token: req.android_token
        });
        res.status(200).send("{}");
    }

});

module.exports = router;
