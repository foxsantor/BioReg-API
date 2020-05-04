const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');
const RefundSchema = new mongoose.Schema(

    {
    email :{
        type : String,
        require : true
    },           
    subscriptionId :{
        type : String,
        require : true
    },
    daysLeft :{
        type : String,
        require : true
    },
    plan :{
        type : String,
        require : true
    },
    planNickname :{
        type : String,
        require : true
    },
    date :{
        type : Date,
        default : Date.now
    }
    }
)

// plugin for passport-local-mongoose 
RefundSchema.plugin(passportLocalMongoose);
const Refund = mongoose.model('Refund',RefundSchema)

module.exports = Refund
