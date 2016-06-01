var cluster = require('cluster');
var my_errno = require('./lib/my_errno');

// Code to run if we're in the master process
if (cluster.isMaster && process.env.NODE_ENV === "production") {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < (process.env.NODE_ENV === "production" ? cpuCount : 1); i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker) {

        // Replace the dead worker, we're not sentimental
        console.log('Worker %d died :(', worker.id);
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    var config        = require('./config'),
        Q             = require('q'),
        express       = require('express'),
        main_router   = require('./routes/router.js'),
        device_register = require('./routes/device_register.js'),
        waiter_routes = require('./routes/waiter/waiter_routes.js'),
        diner_routes  = require('./routes/diner/diner_routes.js'),
        manager_routes= require('./routes/manager/manager_routes.js'),
        waiter_api    = require('./routes/waiter/waiter_api.js'),
        diner_api     = require('./routes/diner/diner_api.js'),
        manager_api   = require('./routes/manager/manager_api.js'),
        auth_api      = require('./routes/auth/auth_api.js'),
        auth_oauth    = require('./routes/auth/auth_oauth.js'),
        auth_web      = require('./routes/auth/auth_web.js'),
        rest_db_inf   = require('./model/restaurantDbInf.js');
        path          = require('path'),
        bcrypt        = require('bcrypt-nodejs'),
        passport      = require('passport'),
        session       = require('express-session'),
        bodyParser    = require('body-parser'),
        app           = express(),
        myredis       = require('./redis/redis_client'),
        redis         = require('redis'),
        ip            = require('ip'),
        crypto        = require('crypto'),
        RedisStore    = require('connect-redis')(session),
        server        = require('http').Server(app),
        io            = require('socket.io')(server),
        PORT          = config.port;



    // in production, redirect all http to https
    if (process.env.NODE_ENV === "production"){

        // console.log('force redirect http to https');
        app.use(function(req, res, next){
            // forward to https only if this is not a health check
            if (req.get('X-Forwarded-Proto') !== 'https' && req.path !== '/health'){
                // console.log('redirecting http to https');
                res.redirect(301, 'https://' + req.get('Host') + req.url);
            } else
                next();
        });
    }






    // set up socket.io connection on multiple nodes
    if (process.env.NODE_ENV === "production") {
        var socketIORedis = require('socket.io-redis');
        io.adapter(socketIORedis({ host: config.redis.host, port: config.redis.port }));
    }


    require('./passport.js')(passport);

    //app.use(express.static(path.join(__dirname, 'public')));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    // use redis to store session cookies in production
    if (process.env.NODE_ENV === "production"){
        var client = redis.createClient(config.redis.port, config.redis.host, {});

        console.log("using Redis to store session cookie");
        app.use(session({
            resave: true,
            saveUninitialized: true,
            store: new RedisStore({
                ttl: 3600,                  // set the Time To Live of session cookie to be 3600 seconds
                host: config.redis.host,
                port: config.redis.port,
                client: client
            }),
            secret: crypto.randomBytes(20).toString('hex')
        }));
    } else
    // use local memory to store session cookies in development
        app.use(session({
            resave: true,
            saveUninitialized: true,
            secret: 'hamster kitten fight'
        }));

    app.use(passport.initialize());
    app.use(passport.session());


    // If user want to visite /console/manager/restaurant/1 
    // and they didn't log in yet. This will ask them to log in
    // then redirect them to /console/manager/restaurant/1 
    var publicPath = ["/signin", "/signup", "/api/signin", "/api/signup", "/bower_components", "/static", "/getip", "/health"];
    function checkPublicPath(url){

        var deferred = Q.defer();
        myredis.checkClassifiedPath(url).then(function(classified){
            if ( classified === "none"){
                if (url === "/") { 
                    myredis.setPathMemory(url, 'public').then(function(){
                        deferred.resolve(true);
                    });
                }
                for (var i = 0; i < publicPath.length; i++){
                    if (url.match(new RegExp("^" + publicPath[i]))){
                        myredis.setPathMemory(url, 'public').then(function(){
                            deferred.resolve(true);
                        });
                        break;
                    }
                }
                if (i === publicPath.length)
                    myredis.setPathMemory(url, 'private').then(function(){
                        deferred.resolve(false);
                    });
            } else
                deferred.resolve(classified);
        });
        return deferred.promise.nodeify();
    }

    app.use(function(req, res, next){
        checkPublicPath(req.url).then(function(result){
            if (result === 'public'){
                next();
            } else if (req.isAuthenticated()) {
                if ('redirect_to' in req.session){
                    var redirect_to = req.session.redirect_to;
                    delete req.session.redirect_to;
                    res.redirect(redirect_to);
                } else 
                    next();
            } else {
                req.session.redirect_to = req.url;
                res.redirect('/signin');
            }
        });
    });




    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use('/', main_router);
    app.use('/', device_register);
    app.use('/console/manager', manager_routes);
    app.use('/console/diner', diner_routes);
    app.use('/console/waiter', waiter_routes);
    app.use('/', manager_api);
    app.use('/', diner_api);
    app.use('/', waiter_api);
    app.use('/', auth_api);
    app.use('/', auth_web);
    app.use('/', waiter_api);
    app.use('/auth', auth_oauth);
    // only serve static file if we're in development, otherwise Nginx will take care of that
    if (process.env.NODE_ENV !== "production"){
        //console.log('serving static file from Node');
        app.use('/static', express.static(path.resolve(__dirname, "public")));
        app.use('/bower_components', express.static(path.resolve(__dirname, "bower_components")));
    }


    // default response in case of server error
    app.use(function(err, req, res, next) {
        console.error(err.stack);
        var http_code = 500;        // assume our fault until proven otherwise
        if (err instanceof my_errno.UserError){
            // if user make error, return 400
            http_code = 400;
        } else {
            // print to save to log
            console.log(err.stack);
        }

        res.status(http_code).send(JSON.stringify({
            code: "code" in err ? err.code : 0,
            message: my_errno.errmsg(err)
        }));
    });

    // set up socket.io
    // call back defines the behavior of each socket.io namespace
    function createSocketIoCallback(currentNamespace){

        return function(socket){
            console.log('a user connected');
            socket.on('disconnect', function(){
                console.log('user disconnected');
            });

            socket.on('chat message', function(msg){
                console.log('message: ' + msg);
                currentNamespace.emit('return', 'hi there');
            });


            socket.on('new message', function(msg){
                console.log('new message: ' + msg);
                currentNamespace.emit('back message', JSON.stringify({
                    username: "username1",
                    message: "Here is my message"
                }));
            });


            socket.on('diner to server', function(msg){
                console.log('diner to server: ' + msg);
                var tablenumber = JSON.parse(msg).tablenumber;
                currentNamespace.to('table-' + tablenumber).emit('server to waiter', msg);
            });

            socket.on('waiter to server', function(msg){
                console.log('waiter to server: ' + msg);
                var tablenumber = JSON.parse(msg).tablenumber;
                currentNamespace.to('table-' + tablenumber).emit('server to diner', msg);
            });

            socket.on('change table', function(tableNumber){
                console.log('change table to ' + tableNumber);
                socket.join('table-' + tableNumber);
            });

            socket.on('leave table', function(tableNumber){
                console.log('leave table from ' + tableNumber);
                socket.leave('table-' + tableNumber);
            });

        };
    }

    // get all restaurant ids and create one namespace for each restaurants in that list based on the id
    rest_db_inf.getAllRestaurantId().then(function(restaurants){
        for (var i = 0; i < restaurants.length; i++){
            var currentNamespace = io.of('/restaurant-namespace-' + restaurants[i].restaurant_id)
            currentNamespace.on('connection', createSocketIoCallback(currentNamespace));
        }
    });

    app.get('/iotest', function(req, res){
      res.sendFile(path.resolve(__dirname + '/views/iotest.html'));
    });

    app.get('/iotest2', function(req, res){
      res.sendFile(path.resolve(__dirname + '/views/iotest2.html'));
    });


    if (!module.parent) {
        //app.listen(PORT);
        server.listen(PORT, function(){
            console.log('listening on %s:%d', ip.address(), PORT);
            if (process.env.NODE_ENV === "production")
                console.log('Worker %d running!', cluster.worker.id);
        });
    } else {
        module.exports = app;
    }
}
