const router = require('express').Router();
const sha256 = require('sha256');
const nodemailer = require("nodemailer");
var otpGenerator = require('otp-generator');
let User = require('../models/user.model');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'project.demo.react.2020@gmail.com',
        pass: 'yfopjjwdbarsrztn'
    }
});

router.route('/').get((req,res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('Error:' + err));
});
// For user login and to generate user token
router.route('/login').post((req,res) => {
    // Get email and password from frontend
    const email = req.body.email;
    const password = req.body.password;
    const time = new Date();
    // Find the user with the email id in mongodb
    User.find({email: email, password: password})
        .then(users => {
            if(!users.length){
                // If not found in db, notify frontend
                res.status(206).json({"message":'Failure'});
            }
            else{
                // Else generate new token for user for token authentication and send token to frontend
                users[0].sessionToken = sha256(email + time.toString());
                users[0].save()
                    .then(() => 
                    res.json(
                        {
                            "message":'Success',
                            "token": sha256(email + time.toString())
                        }
                        )
                    )
                    .catch(err => res.status(400).json('Error:' + err));    
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To get user session token for seamless login
router.route('/get_session').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            // console.log(user);
            if(user.length === 0){
                res.status(204).json({'message': 'Failed'});
            }
            else{
                const lastLogin = user[0].lastLoggedIn;
                user[0].lastLoggedIn = new Date()
                user[0].save()
                    .then(() => {
                        res.json(
                            {
                                "username": user[0].username,
                                "lastLoggedIn": lastLogin,
                                "profileversion": user[0].profilepicversion
                            })
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To get user details for seamless login
router.route('/get_user_details').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            // console.log(user);
            if(user.length === 0){
                res.status(204).json({'message': 'Failed'});
            }
            else {
                res.json
                (
                    {
                        "username": user[0].username,
                        "mobile": user[0].mobile,
                        "status": user[0].status
                    }
                );
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To get user profilepic for seamless login
router.route('/get_user_picture').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            // console.log(user);
            if(user.length === 0){
                res.status(204).json({'message': 'Failed'});
            }
            else {
                res.json
                (
                    {
                        "profilepic": user[0].profilepic
                    }
                );
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To check the locally stored session token in the Mongo DB
router.route('/check_session').post((req,res) => {
    const token = req.body.token;
    User.findOne({ sessionToken: token })
        .then(user => {
            if(!user){
                res.json({'message': 'Failed'});
            }
            else{
                user.lastLoggedIn = new Date();
                user.save()
                    .then(() => {
                        res.json({"message": "Success"});
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To request OTP for registering
router.route('/request_otp').post((req,res) => {
    const email = req.body.email;
    User.find({email: email})
        .then(users => {
            if(users.length){
                res.status(208).json({
                    "message": "failure"
                });
            }
            else{
                const otp = otpGenerator.generate(5, { alphabets: false, specialChars: false, upperCase: false });
        
                var mailOptions = {
                    from: 'mindwebsmailer@gmail.com',
                    to: email,
                    subject: 'Demo OTP verification',
                    text: 'Your OTP for verification is ' + otp
                };
                    
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        res.status(400).json('Error:' + error);
                    } else {
                        res.json({
                            "message": "success",
                            "otp": sha256(otp)
                        });
                    }
                });
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To register an user
router.route('/register').post((req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const profilepic = "data:image/png;base64,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";
    const sessionToken = 'NULL';
    const lastLoggedIn = new Date();
    const resetToken = 'NULL';
    const mobile = req.body.mobile;
    const status = req.body.status;
    const profilepicversion = 0;
    const newUser = new User({ username, password, email, profilepic, sessionToken, lastLoggedIn, resetToken, mobile, status, profilepicversion });
    newUser.save()
        .then(() => res.status(201).json({
            "message": "Success"
        }))
        .catch(err => res.status(400).json('Error:' + err));
});

// Update Profile Pic of the user
router.route('/update_picture').post((req,res) => {
    const token = req.body.token;
    User.findOne({sessionToken: token})
    .then(user => {
        user.profilepic = req.body.pic;
        user.save()
            .then(() => res.json({"message":"User Details updated"}))
            .catch(err => res.status(400).json('Error:' + err));
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Update Details of the user
router.route('/update_details').post((req,res) => {
    const token = req.body.token;
    User.findOne({sessionToken: token})
    .then(user => {
        user.username = req.body.username;
        user.mobile = req.body.mobile;
        user.status = req.body.status;
        user.save()
            .then(() => res.json('User Details updated'))
            .catch(err => res.status(400).json('Error:' + err));
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Change password for the user
router.route('/change_password').post((req,res) => {
    const token = req.body.token;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    User.findOne({sessionToken: token, password: oldPassword})
    .then(user => {
        if(!user){
            res.json({"message" : "Failure"});
        }
        else{
            user.password = newPassword;
            user.save()
                .then(() => res.json('Password updated'))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Generate link for user to reset password and send to email
router.route('/forgot_password').post((req,res) => {
    const email = req.body.email;
    const time = new Date();
    const resetToken = sha256(email + time.toString());

    User.findOne({email : email})
        .then(user => {
            if(!user){
                res.status(204).json({"message" : "Failure"});
            }
            else{
                user.resetToken = resetToken;
                user.save()
                    .then(() => {
                        var mailOptions = {
                            from: 'project.demo.react.2020@gmail.com',
                            to: email,
                            subject: 'Reset Password Link',
                            html: "Go to the link below to reset your password <br><br><br>" + "<a href='https://relaxed-wescoff-bb0367.netlify.app/set-password/"+resetToken+"'>Click here to reset password</a>"
                        };
                            
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                res.status(400).json('Error:' + error);
                            } else {
                                res.json({"message" : "Success"});
                            }
                        });
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// Reset the actual password from the email link
router.route('/reset_password').post((req,res) => {
    const resettoken = req.body.token;
    const newPassword = req.body.newPassword;
    User.findOne({resetToken: resettoken})
    .then(user => {
        if(!user){
            res.status(204).json({"message" : "Failure"});
        }
        else{
            user.password = newPassword;
            user.resetToken = 'NULL';
            user.save()
                .then(() => res.json({"message":'Password reset'}))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Verify the token for reset such that it cannot be done multiple times
router.route('/check_reset_token/:token').get((req,res) => {
    const resettoken = req.params.token;
    // console.log(resettoken);
    User.findOne({resetToken: resettoken})
    .then(user => {
        if(!user){
            res.status(204).json({"message" : "Failure"});
        }
        else{
            res.json({"message" : "Success"});
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});


module.exports = router;