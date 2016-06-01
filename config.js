module.exports = {
    'port' : process.env.PORT,
    'facebookAuth' : {
        'clientID'      : process.env.FACEBOOK_OAUTH_CLIENTID,
        'clientSecret'  : process.env.FACEBOOK_OAUTH_CLIENTSECRET,
        'callbackURL'   : process.env.FACEBOOK_OAUTH_CALLBACK 
    },
    'googleAuth' : {
        'clientID'      : process.env.GOOGLE_OAUTH_CLIENTID,
        'clientSecret'  : process.env.GOOGLE_OAUTH_CLIENTSECRET,
        'callbackURL'   : process.env.GOOGLE_OAUTH_CALLBACK 
    },
    'postgres': {
        'password' : process.env.RDS_PASSWORD ,
        'host' :  process.env.RDS_HOSTNAME ,
        'user' : process.env.RDS_USERNAME ,
        'port' : process.env.RDS_PORT
    },
    'amazon': {
        's3' : {
            'accessKeyId': process.env.AWS_S3_ACCESS_KEY_ID,
            'accessKey': process.env.AWS_S3_ACCESS_KEY
        }
    },
    'redis': {
        'host': process.env.REDIS_HOST,
        'port': process.env.REDIS_PORT
    },
    'google':{
        'gcm_api_key': process.env.GOOGLE_GCM_API_KEY
    }
};
