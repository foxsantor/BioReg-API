const express = require('express')
const User = require('../Models/User')
const Refund = require('../Models/Refund')
const Questions = require('../Models/Questions')
const Activitys = require('../Models/Activitys')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()
const async = require('async')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const stripe = require('stripe')('sk_test_Os08IxuPe89dKTQLB4Q4QhEw00Zwzbhykz');

/*stripe.customers.create({
  email: 'barbatos252@gmail.com',
})
  .then(customer => console.log(customer.id))
  .catch(error => console.error(error));*/

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
  state = "active";
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
        const newUser = new User({ firstName, lastName, email, password, state })
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
  modification = "";
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
        modification +="/ updated firstName:"+user.firstName+" => "+firstName;
        user.firstName = firstName
      }
      if (lastName) {
        modification +="/ updated lastName:"+user.lastName+" => "+lastName;
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
              modification +="/ updated the password";
              user.save();
              regiterActivitys(email,modification);
            }))
          }
        }
      }
      else
      {
        regiterActivitys(email,modification);
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


//new subscription Handle
router.put('/newSubscription', (req, res) => {
  //newSubscription()
  const { firstName, lastName, email, password, passwordCheck ,ville,address,zipCode,phone} = req.body
  const data = { firstName : req.body.firstName, 
                 lastName : req.body.lastName, 
                 email : req.body.email ,
                 ville : req.body.ville ,
                 address : req.body.address ,
                 zipCode : req.body.zipCode ,
                 phone : req.body.phone,
                 subscription : "subscribed",
                 subscriptionStartDate : Date.now()} 

  creatCustomer(req.body.email,req.body.cardToken);
  newSubscription(req.body.email,req.body.cardToken)
  
  let errors = []
  if (errors.length > 0) {
    //render register page again and refill the form
    errors.forEach(element => { console.log(element.message) })

  } else {
    //Validation pass
    User.findOneAndUpdate({ email: email }, data, {upsert: true}, function(err, doc) {
      if (err) return res.status(500).json({error: err});
      return res.send('Succesfully saved.');
  });
  }
})

function newSubscription(mail,cardToken)
{
  
  (async () => {
    stripe.customers.list(
      {limit: 1,
      email : mail},
      function(err, customers) {
        customers.data.forEach(element => {

          stripe.plans.list(
            {limit: 1},
            function(err, plans) {
              plans.data.forEach(plan => {
                (async () => {
                  const subscription = await stripe.subscriptions.create({
                    customer: element.id,
                    //collection_method : "charge_automatically",
                    cancel_at_period_end : false, //false for auto charge at periode end
                    trial_period_days: 3,//number of day in the trial
                    items: [
                      {
                        plan: plan.id,
                        quantity: 1,
                      },
                    ],
                  },function(err,result)
                  {
                    console.log(err)
                  }
                  );})();
              });
        });
        });
      }
    );
  })();
}

router.put('/cancelSubscription', (req, res) => {
  const { id } = req.body
  let errors = []
  if (errors.length > 0) {
    //render register page again and refill the form
    errors.forEach(element => { console.log(element.message) })

  } else {
    stripe.subscriptions.del(
      id,
      function(err, confirmation) {
        console.log(confirmation)
      }
    );
  }
})

router.put('/cancelTrial', (req, res) => {
  const { id } = req.body
  let errors = []
  if (errors.length > 0) {
    //render register page again and refill the form
    errors.forEach(element => { console.log(element.message) })

  } else {
    stripe.subscriptions.update(id, {
      trial_end: 'now',
    });

    stripe.subscriptions.del(
      id,
      function(err, confirmation) {
        res.json(confirmation)
      }
    );

  }
})

router.get('/subscriptionList', isValidUser,function (req, res) {
  (async () => {
    stripe.customers.list(
      {limit: 1,
      email : req.user.email},
      function(err, customers) {
        customers.data.forEach(element => {
          
          stripe.subscriptions.list(
            {limit: 100,customer:element.id,status:"all"},
            function(err, subscriptions) {
              res.json(subscriptions.data);
            }
          );

        });
      }
    );
  })();
});


router.post('/refundRequest',function (req, res) {
  const { subscriptionId } = req.body

    stripe.subscriptions.retrieve(
      subscriptionId,
      function(err, subscription) {
        
        stripe.customers.retrieve(
          subscription.customer,
          function(err, customer) {
            subscription.items.data.forEach(element => {
              console.log(element.plan.nickname)
              Refund.findOne({ email: customer.email,subscriptionId:subscriptionId }).then(refund => {
                if (refund) {
                  //User exist render the veiw again with refilling the fileds 
                 // errors.push({ message: "refund already pending" })
                  errors.forEach(element => { console.log(element.message) })
                  res.send("something went wrong")
                } else {
                  var diff = Math.abs(
                    new Date(subscription.current_period_start).getTime() - 
                    new Date(subscription.current_period_end).getTime()
                                       );
                    var daysLeft = Math.ceil(diff / (1000 * 3600 * 24)); 
                    console.log(daysLeft)
               
                  email = customer.email;
                  planNickname = element.plan.nickname
                  const newrefund = new Refund({ email, subscriptionId ,daysLeft, planNickname})
                  
                  newrefund.save()
                }
          
              })


            });
           
          }
        );

      }
    );
  

});


router.post('/askQuestons',function (req, res) {
  const { question,email} = req.body
  const newQuestion = new Questions({ email, question})
  newQuestion.save()
});

router.post('/listquestions', function (req, res) {
  const { email} = req.body
  Questions.find({email:email},function(err, questions){
    if(err)
    {
      res.send('somthing went wrong');
      next();
    }
    res.json(questions);
  })
  //return res.status(200).json();
});

function subscriptionCheck() {
  (async () => {
    stripe.customers.list(
      {limit: 1,
      },
      function(err, customers) {
        customers.data.forEach(customer => {

          //console.log(customer.subscriptions.data);
          
          customer.subscriptions.data.forEach(element => {

            var diff = Math.abs(
              new Date(element.current_period_start).getTime() - 
              new Date(element.current_period_end).getTime()
                                 );
              var diffDays = Math.ceil(diff / (1000 * 3600 * 24)); 
              if(diffDays < 7 )
              sendAlertMails(customer.email,diffDays);
          });

        });
      }
    );
  })();
}

function trialsCheck()
{
  (async () => {
    stripe.subscriptions.list(
        {limit: 100,status:"trialing"},
        function(err, subscriptions) {
            subscriptions.data.forEach(element => {
              var diff = Math.abs(
                new Date(element.trial_start).getTime() - 
                new Date(element.trial_end).getTime()
                                   );
                var diffDays = Math.ceil(diff / (1000 * 3600 * 24)); 
                if(diffDays <= 3 )
                {
                  stripe.customers.retrieve(
                    element.customer,
                    function(err, customer) {
                      sendAlertTrialMails(customer.email,diffDays);
                    }
                  );
                
              }

            });
        }
      );
})();
}

function sendAlertTrialMails(mail,days){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'qtcreator6@gmail.com',
      pass: '123456789az'
    }
  });
  
  var mailOptions = {
    from: 'bioreginc@gmail.com',
    to: mail,
    subject: 'Trial periode',
    text: 'your trial periode to our services ends in '+days+' your paied subsciption will start after the prementioned days unless canceled'
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  }

function sendAlertMails(mail,days){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'qtcreator6@gmail.com',
      pass: '123456789az'
    }
  });
  
  var mailOptions = {
    from: 'bioreginc@gmail.com',
    to: mail,
    subject: 'Subscription Renewal',
    text: 'your subscription to our service will end in '+days+' it will be renewed automaticly unless canceled'
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  }

function creatCustomer(mail,cardToken)
{
  (async () => {
    stripe.customers.list(
      {limit: 1,
        email:mail
      },
      function(err, customers) {
        if(customers.data.length == 0)
        {

          stripe.customers.create(
            {
              email: mail,
            },
            function(err, customer) {
              stripe.tokens.retrieve(
                cardToken.id,
                function(err, token) {
                  //console.log(token.card)
                  
                  stripe.customers.createSource(
                    customer.id,
                    {source: token.id},
                    function(err, card) {
                     console.log(card)
                    }
                  );
                }
              );
            }
          );
        }
        else
        {
          console.log("customer already exist")
        }
      }
    );
  })();
 
}
  
function test(){
  /*stripe.tokens.retrieve(
    'tok_1Ge9MAAp8FZAkd8h0LSbCYKX',
    function(err, token) {
      //console.log(token.card)
      
      stripe.customers.createSource(
        'cus_HCYRFWtb2oZTOW',
        {source: token.id},
        function(err, card) {
         console.log(card)
        }
      );
    }
  );*/

  stripe.plans.list(
    {limit: 1},
    function(err, plans) {
      plans.data.forEach(plan => {
        (async () => {
          const subscription = await stripe.subscriptions.create({
            customer: "cus_HCYRFWtb2oZTOW",
            //collection_method : "charge_automatically",
            cancel_at_period_end : true,
            items: [
              {
                plan: plan.id,
                quantity: 1,
              },
            ],
          },function (err,subscription)
          {
            subscription.items.data.forEach(element => {
              //console.log(element.plan.id)
              /*stripe.checkout.sessions.create(
                {
                  success_url: 'https://example.com/success',
                  cancel_url: 'https://example.com/cancel',
                  payment_method_types: ['card'],
                  customer : 'cus_HCYRFWtb2oZTOW',
                  subscription_data : {
                    items: [{
                      plan: element.plan.id,
                    }],
                  },
                },
                function(err, session) {
                  console.log(session)
                }
              );*/
            });
            
          }
          
          );})();

         


      });
});
  
}

//test();
function regiterActivitys(user,modification)
  {
      const newActivitys = new Activitys({ user,modification })

      newActivitys.save()

          .then(activitys => {
              req.flash('sucess_msg', 'You are now registerd and can log in')
              res.send("good")
              //redirect to /login
              //res.redirect('/users/login')
          })
          .catch(err => console.log(err))
    console.log("activitys updated")
  }

setInterval(trialsCheck, 86400000);
setInterval(subscriptionCheck, 86400000);
module.exports = router