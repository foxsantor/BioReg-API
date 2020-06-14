const express = require('express')
const User = require('../Models/User')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()


//Login Page
router.get('/login',(req,res) => res.send('Login'))
//Register Page
router.get('/register',(req,res) => res.send('Register'))


//Logout Handle
router.get('/logout',(req,res)=>{
    req.logout()
    res.redirect('/login')
})

//Login Handle
router.post('/login',function(req, res , next) {
    passport.authenticate('local', function(err, user, info) {
   
        if (err) { return next(err); }
        if (!user) { 
            var Message ={ "message" : info.message }
            res.status(200).json(Message);
            res.end();
            return;
        }else{
            var Email ={ "email" : user.email }
            res.status(200).json(Email);
            res.end();
        }
})(req, res, next)
})
//login Handler 2





module.exports = router