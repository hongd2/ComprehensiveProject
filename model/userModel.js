var DB = require('../db').DB,
    knex = DB.knex;

var User = DB.Model.extend({
    tableName: 'users',
    idAttribute: 'user_id',
    Facebook: function() {
        return this.hasOne(Facebook, 'user_id');
    },
    Google: function() {
        return this.hasOne(Google, 'user_id');
    }
});

var Facebook = DB.Model.extend({
    tableName: 'facebook',
    idAttribute: 'user_id',
    User: function() {
        return this.belongsTo(User, 'user_id');
    }
});

var Google = DB.Model.extend({
    tableName: 'google',
    idAttribute: 'user_id',
    User: function() {
        return this.belongsTo(User, 'user_id');
    }
});


// ------------------------------
// createNewUser
// ------------------------------
// Makes a new user in the database with 
// automatic incremented ID. Then, returns
// that user's ID after the user is created.
function createNewUser(callback) {
    new User().save().then(function(user) {
        callback(user.toJSON().user_id);
    });
}

// ------------------------------
// grabUserCredentials
// ------------------------------
// Returns a JSON list of a single user like this:
// {
//     local: {
//          username: 'sampleun'
//          password: 'samplepw'
//     },
//     facebook: {
//          ...
//     },
//     twitter: {
//          ...
//     },
//     google: {
//          ...
//     },
// }
function grabUserCredentials(userId, callback) {

    // Skeleton JSON
    var loginUser = {
        local: {
            username: null,
            salt: null,
            password: null,
        },
        facebook: {
            user_id: userId,
            token: null
            //email: null,
            //name: null,
        },
        google: {
            id: userId,
            token: null,
            googleId: null,
            email: null,
            name: null,
        },
        manager: {},
        waiter: {},
        diner: {},
        name: "unknown name",
        user_id: null

    };

    // SQL joins to get all credentials/tokens of a single user
    // to fill in loginUser JSON.
    knex.select('users.user_id', 'users.username', 'users.password', 'users.salt',
                'facebook.token as fb_token', 'facebook.display_name as fb_name',
                'google.token as g_token', 'google.google_id as g_id', 'google.email as g_email', 'google.name as g_name',
                'manager_flag', 'diner_flag', 'waiter_flag')
                .from('users')
                .leftOuterJoin('facebook', 'facebook.user_id', '=', 'users.user_id')
                .leftOuterJoin('google', 'google.user_id', '=', 'users.user_id')
                .where('users.user_id', '=', userId).then(function(row) {
        row = row[0];

        if (!row) {
            callback('Could not find user with that ID', null);
        } else {
            // Fill in loginUser JSON
            loginUser.local.username      = row.username;
            loginUser.local.password      = row.password;
            loginUser.local.salt          = row.salt;

            loginUser.facebook.token      = row.fb_token;
            loginUser.facebook.display_name       = row.fb_name;

            loginUser.google.token        = row.g_token;
            loginUser.google.googleId     = row.g_id;
            loginUser.google.email        = row.g_email;
            loginUser.google.name         = row.g_name;

            loginUser.manager.flag        = row.manager_flag;

            loginUser.diner.flag        = row.diner_flag;

            loginUser.waiter.flag        = row.waiter_flag;

            if (loginUser.local.username.length > 0)
                loginUser.name = loginUser.local.username;
            else if (loginUser.local.facebook.display_name.length > 0)
                loginUser.name = loginuser.facebook.display_name;
            else if (loginUser.local.google.name.length > 0)
                loginUser.name = loginuser.google.name;

            loginUser.user_id = row.user_id;
 
            callback(null, loginUser);
        }
    });
};

// need to revisit this one. It must be asynchronous and use promise. For now just return true
function checkManagerFlag(user_id){
    return true;
    
        //User.where({user_id: user_id}).fetchAll().then(function(user){
        //    //console.log("found manager = ", manager.toJSON());
        //    res.render('restaurantManagePanel', {user: user});
        //});
}

module.exports = {
    createNewUser       : createNewUser,
    grabUserCredentials : grabUserCredentials,
    User                : User,
    Facebook            : Facebook,
    Google              : Google,
    checkManagerFlag    : checkManagerFlag
};
