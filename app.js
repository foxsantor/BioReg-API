const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')


const app = express()
//Passport Config
require('./config/passport')(passport)
const mongoose = require('mongoose')

//DB Config
const db = require('./config/Keys').MongoURI

//Connect to Mongo
mongoose.connect(db,{useUnifiedTopology: true,useNewUrlParser: true})
.then(()=> console.log('MongoDB Connected ...'))
.catch(err=>console.log(err))

// Bodyparser
app.use(express.urlencoded({ extended: false}))
app.use(express.json())

//Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }))
//Passport middleware
app.use(passport.initialize())
app.use(passport.session()) 

//Connect flash
app.use(flash())

//Global vars
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('sucess_msg')
    res.locals.error_msg = req.flash('error_msg')
    next()
})

//Routes
app.use('/',require('./routes/index'))
app.use('/users',require('./routes/users'))



const PORT = process.env.PORT || 5000
app.listen(PORT,console.log('Server started on PORT: '+ PORT))