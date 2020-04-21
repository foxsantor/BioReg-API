const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');
const UserSchema = new mongoose.Schema(

    {
    firstName :{
        type : String,
        require : true
    },         
    lastName :{
        type : String,
        require : true
    }, 
    email :{
        type : String,
        require : true
    },
    zipCode :{
        type : String,
        require : true
    },
    phone :{
        type : String,
        require : true
    },
    address :{
        type : String,
        require : true
    },
    ville :{
        type : String,
        require : true
    },
    state :{
        type : String,
        require : true
    },
    subscription :{
        type : String,
        require : true
    },
    subscriptionStartDate :{
        type : Date,
    },
    password :{
        type : String,
        require : true
    },
    resetPasswordToken :{
        type : String,
    },
    resetPasswordExpires :{
        type : Date,
    },
    date :{
        type : Date,
        default : Date.now
    }
    }
)

// plugin for passport-local-mongoose 
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User',UserSchema)

module.exports = User
