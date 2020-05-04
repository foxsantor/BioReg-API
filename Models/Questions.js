const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');
const QuestionsSchema = new mongoose.Schema(

    {
    email :{
        type : String,
        require : true
    },           
    question :{
        type : String,
        require : true
    },
    answer :{
        type : String,
        require : true
    },
    state :{
        type : Boolean,
        default : false
    },
    dateQuestion :{
        type : Date,
        default : Date.now
    },
    dateAnswer :{
        type : Date,
    }
    }
)

// plugin for passport-local-mongoose 
QuestionsSchema.plugin(passportLocalMongoose);
const Questions = mongoose.model('Questions',QuestionsSchema)

module.exports = Questions
