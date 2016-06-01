var manager_db_inf = require('./model/managerDbInf.js');

manager_db_inf.addNewSubscriptionPlan({restaurant_id: 1, subscription_plan_id: 1}).then(function(sub_record){console.log(sub_record)});
