var express = require('express');
var router = express.Router();

router.get('/getip', function(req, res, next){
    res.type('json').status(200).send(JSON.stringify({"ip": ip.address()}));
});

router.get('/health', function(req, res, next){
    res.type('json').status(200).send("");
});

// --------------------------------------------------
// Routes for main page
// --------------------------------------------------
router.get('/', function(req, res, next) {
    res.render('infopage', {});
});

function countRole(user){
    var count = 0;
    if (user.manager.flag)
        count++;
    if (user.waiter.flag)
        count++;
    if (user.diner.flag)
        count++;
    return count;
}

router.get('/console', function(req, res, next) {
    if (req.isAuthenticated()) {
        var user = req.user;
        if (countRole(user) > 1)
            res.render('common/roleSelection', {user: user});
        else if (user.manager.flag)
            res.redirect('/console/manager');
        else if (user.waiter.flag)
            res.redirect('/console/waiter');
        else if (user.diner.flag)
            res.redirect('/console/diner');
        else
            res.status(500).send("");
    } else {
        res.redirect('/signin');
    }
});

module.exports = router;
