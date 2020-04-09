const express = require('express')
//const User = require('../Models/User')
const Admin = require('../Models/Admin')
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


//Logout Handle
//added isValidAdmin
router.get('/logout', isValidAdmin, (req, res) => {
    req.logout()
    //res.redirect('/login')
    res.redirect('http://localhost:4200/#/pages/login')
})

//Login Handle
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, admin, info) {
        if (err) { return res.status(501).json(err); }
        if (!admin) { return res.status(501).json(info); }
        req.logIn(admin, function (err) {
            if (err) { return res.status(501).json(err); }
            return res.status(200).json({ message: 'Login Success' });
        });
    })(req, res, next);
});

//users list
router.get('/listAdmins', function (req, res) {
    Admin.find({}, function (err, admins) {
        if (err) {
            res.send('somthing went wrong');
            next();
        }
        res.json(admins.s);
    })
    //return res.status(200).json();
});
//profile handle 
router.get('/adminProfile', isValidAdmin, function (req, res, next) {
    return res.status(200).json(req.admin);
});
//logged user verification
function isValidAdmin(req, res, next) {
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
    const { password, passwordCheck } = req.body;
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
    
    const { firstName, lastName, email, password, passwordCheck, gender, position, qualification, phoneNumber } = req.body
    //console.log(passwordCheck)
    let errors = []
    console.log(req.body);
    //Cheeck require fields
    if (!firstName | !lastName | !email | !password | !passwordCheck | !position | !qualification | !phoneNumber | !gender) {
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
        Admin.findOne({ email: email }).then(admin => {
            if (admin) {
                //User exist render the veiw again with refilling the fileds 
                errors.push({ message: "Email is already registered" })
                errors.forEach(element => { console.log(element.message) })
                res.send("something went wrong")
            } else {
                const newAdmin = new Admin({ firstName, lastName, email, password, gender, position, qualification, phoneNumber})
                //console.log(newUser)
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newAdmin.password, salt, (err, hash) => {
                    if (err) throw err
                    //Set password to hashed
                    newAdmin.password = hash
                    //Save user MongoDB 
                    newAdmin.save()

                        .then(admin => {
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

    const { firstName, lastName, email, password, passwordCheck, phoneNumber } = req.body
    let errors = []
    if (errors.length > 0) {
        //render register page again and refill the form
        errors.forEach(element => { console.log(element.message) })

    } else {
        //Validation pass
        Admin.findOne({ email: email }).then(admin => {
            //console.log(user)
            if (firstName) {
                admin.firstName = firstName
            }
            if (lastName) {
                admin.lastName = lastName
            }
            if (phoneNumber) {
                admin.phoneNumber = phoneNumber
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
                            admin.password = hash;
                            admin.save();
                        }))
                    }
                }
            }
            else {
                admin.save();
            }
        })
    }
})



module.exports = router