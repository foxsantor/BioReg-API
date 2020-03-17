const express = require('express')
const User = require('../Models/User')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()
const async = require('async')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

//Login Page
router.get('/login', (req, res) => res.send('Login'))
//Register Page
router.get('/register', (req, res) => res.send('Register'))
//profile page
//router.get('/profile',(req,res) => res.send('Profile'))

//Logout Handle
//added isValidUser
router.get('/logout', isValidUser, (req, res) => {
  req.logout()
  //res.redirect('/login')
  res.redirect('http://localhost:4200/home')
})

//Login Handle
/*router.post('/login',(req,res,next)=>{
passport.authenticate('local',{
// User page or Homepage or Dashbored
//successRedirect : '/dashboard',
successRedirect : '',
// Login page again
//failureRedirect : '/users/login',
failureRedirect : '',
//flash message for session web 
failureFlash : true
})(req,res,next)
})*/

//Login Handle 2
router.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) { return res.status(501).json(err); }
    if (!user) { return res.status(501).json(info); }
    req.logIn(user, function (err) {
      if (err) { return res.status(501).json(err); }
      return res.status(200).json({ message: 'Login Success' });
    });
  })(req, res, next);
});
//users list
router.get('/listUsers', function (req, res) {
  User.find({},function(err, users){
    if(err)
    {
      res.send('somthing went wrong');
      next();
    }
    res.json(users);
  })
  //return res.status(200).json();
});
//profile handle 
router.get('/profile', isValidUser, function (req, res, next) {
  return res.status(200).json(req.user);
});
//logged user verification
function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized Request' });
}

//reset password Handle
router.post('/forgotPassword', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'qtcreator6@gmail.com',
          pass: '123456789az'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('');
  });
});

router.get('/reset/:token', function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('');
    }
    //res.render('reset.ejs', {token: req.params.token});
    //return res.status(200).json(req.user);
    //console.log(req.params.token);
    res.redirect('http://localhost:4200/resetPassword/' + req.params.token);


  });
});

router.post('/reset/:token', function (req, res) {
  const {password, passwordCheck } = req.body;
  console.log(password);
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.passwordCheck) {

          bcrypt.genSalt(10, (err, salt) => bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err
            //Set password to hashed
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.password = hash;
            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          }))
          
          /*user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })*/
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'qtcreator6@gmail.com',
          pass: '123456789az'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'qtcreator6@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
        console.log('mail sent');
      });
    }
  ], function (err) {
    res.redirect('http://localhost:4200/home');
  });
});

// Register Handle
router.post('/register', (req, res) => {

  const { firstName, lastName, email, password, passwordCheck } = req.body
  //console.log(passwordCheck)
  let errors = []
  //Cheeck require fields
  if (!firstName | lastName | !email | !password | !passwordCheck) {
    errors.push({ message: "please fill in all fields" })
  }
  //Check password Match

  if (password !== passwordCheck) {
    errors.push({ message: "password doesn't match" })
  }

  //Check pass length
  if (password.length < 6) {

    errors.push({ message: "password should be at least 6 charchters" })
  }

  if (errors.length > 0) {
    //render register page again and refill the form
    errors.forEach(element => { console.log(element.message) })

  } else {
    //Validation pass
    User.findOne({ email: email }).then(user => {
      if (user) {
        //User exist render the veiw again with refilling the fileds 
        errors.push({ message: "Email is already registered" })
        errors.forEach(element => { console.log(element.message) })
        res.send("something went wrong")
      } else {
        const newUser = new User({ firstName, lastName, email, password })
        //console.log(newUser)
        bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err
          //Set password to hashed
          newUser.password = hash
          //Save user MongoDB 
          newUser.save()

            .then(user => {
              req.flash('sucess_msg', 'You are now registerd and can log in')
              res.send("good")
              //redirect to /login
              //res.redirect('/users/login')
            })
            .catch(err => console.log(err))
        }))
      }

    })
  }
})

//update profile
router.put('/updateProfile', (req, res) => {

  const { firstName, lastName, email, password, passwordCheck } = req.body
  //console.log(passwordCheck)
  let errors = []
  //Check password Match

  /*if (password !== null) {
    if (password !== passwordCheck) {
      errors.push({ message: "password doesn't match" })
    }

    //Check pass length
    if (password.length < 6) {

      errors.push({ message: "password should be at least 6 charchters" })
    }
  }
  else {
    console.log("null");
  }*/
  if (errors.length > 0) {
    //render register page again and refill the form
    errors.forEach(element => { console.log(element.message) })

  } else {
    //Validation pass
    User.findOne({ email: email }).then(user => {
      //console.log(user)
      if (firstName) {
        user.firstName = firstName
      }
      if (lastName) {
        user.lastName = lastName
      }
      if (password) {
        if (password !== passwordCheck) {
          errors.push({ message: "password doesn't match" })
        }
        else {
          //Check pass length
          if (password.length < 6) {
            errors.push({ message: "password should be at least 6 charchters" })
          }
          else {
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
              if (err) throw err
              //Set password to hashed
              user.password = hash;
              user.save();
            }))
          }
        }
      }
      else
      {
        user.save();
      }
      
      /*user.updateOne(user,req.body)
      .then(doc=>{
        if(!doc)
        {
          return res.status(404).end();
        }
        return res.status(200).json(doc);
      })
      .catch(err=>next(err))*/
    })
  }
})



module.exports = router