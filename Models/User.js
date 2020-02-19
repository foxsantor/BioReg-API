const mongoose = require('mongoose')
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

const User = mongoose.model('User',UserSchema)

module.exports = User
