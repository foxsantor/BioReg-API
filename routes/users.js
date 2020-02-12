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
router.post('/login',(req,res,next)=>{
passport.authenticate('local',{
// User page or Homepage or Dashbored
successRedirect : '/dashboard',
// Login page again
failureRedirect : '/users/login',
//flash message for session web 
failureFlash : true
})(req,res,next)
})

// Register Handle
router.post('/register',(req,res)=>{

    const {name ,email,password,passwordCheck} = req.body
    //console.log(passwordCheck)
    let errors = []
    //Cheeck require fields
    if(!name | !email | !password | !passwordCheck)
    {
        errors.push({message : "please fill in all fields"})
    }
    //Check password Match

    if(password !== passwordCheck)
    {
        errors.push({ message : "password doesn't match"})  
    }

    //Check pass length
    if(password.length < 6)
    {

        errors.push({ message : "password should be at least 6 charchters"}) 
    }

    if(errors.length > 0)
    {
        //render register page again and refill the form
        errors.forEach(element => { console.log(element.message)})

    }else
    {
        //Validation pass
       User.findOne({email: email}).then(user => {    
        if(user)
        { 
        //User exist render the veiw again with refilling the fileds 
        errors.push({ message : "Email is already registered"}) 
        errors.forEach(element => { console.log(element.message)})
        res.send("something went wrong")
        }else
        {
        const newUser = new User({name,email,password})
            //console.log(newUser)
    bcrypt.genSalt(10,(err,salt)=> bcrypt.hash(newUser.password,salt,(err,hash)=>{
        if(err) throw err
        //Set password to hashed
        newUser.password=hash
        //Save user MongoDB 
        newUser.save()
        
        .then(user=>{
            req.flash('sucess_msg', 'You are now registerd and can log in')
            res.send("good")
            //redirect to /login
            //res.redirect('/users/login')
        })
        .catch(err=>console.log(err))
    }))           
    }
    
    })
    }
    




})


module.exports = router