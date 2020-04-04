const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');
const AdminSchema = new mongoose.Schema(
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
    password :{
        type : String,
        require : true
    },
    gender :{
        type : String,
    },
    position :{
        type : String,
    },
    qualification :{
        type : String,
    },
    phoneNumber :{
        type : String,
    },
    administrator :{
        type : Boolean,
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
AdminSchema.plugin(passportLocalMongoose);
const Admin = mongoose.model('Admin',AdminSchema)

module.exports = Admin
