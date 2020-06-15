const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');
const ActivitysSchema = new mongoose.Schema(
    {
    user :{
        type : String,
        require : true
    },         
    modification :{
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
ActivitysSchema.plugin(passportLocalMongoose);
const Activitys = mongoose.model('Activitys',ActivitysSchema)

module.exports = Activitys
