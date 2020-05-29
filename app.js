const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
var cors= require('cors');




//mejda
bodyParser = require('body-parser')


//mejda
// Routes to Handle Request
const productRoute = require('./routes/product.route')
const blogs = require('./routes/blogs')






const app = express()
//Passport Config
require('./config/passport')(passport)
const mongoose = require('mongoose')

app.use(cors({
  origin:['http://localhost:4200','http://127.0.0.1:4200','http://192.168.1.3:5000'],
  credentials:true
})) 


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
const MongoStore = require('connect-mongo')(session)
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie:{
      maxAge:36000000,
      httpOnly:false,
      secure:false
    }
    ,store:new MongoStore({mongooseConnection:mongoose.connection})
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
app.use('/admins',require('./routes/admins'))




app.use('/blogs', require('./routes/blogs') );



//mejda
// Make "public" Folder Publicly Available
app.use('/public', express.static('public'));

//mejda
// API Route
app.use('/api', productRoute)

//mejda
// Error favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204));







const PORT = process.env.PORT || 5000
app.listen(PORT,console.log('Server started on PORT: '+ PORT))





//mejda
// Error
app.use((req, res, next) => {
  // Error goes via `next()` method
  setImmediate(() => {
    next(new Error('Something went wrong'));
  });
});

app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});