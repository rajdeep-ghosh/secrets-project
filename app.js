require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
    secret: 'This is my secret.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Connect MongoDB at default port 27017.
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.');
    } else {
        console.log('Error in DB connection: ' + err);
    }
});

// Create user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

// Setup mongoose-encryption to encrypt password field in mongodb
// userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, excludeFromEncryption: ['email']});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create user schema model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (!err) {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        } else {
            console.log(err);
            res.redirect('/register');
        }
    });


    // bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    //     if (!err) {
    //         const user = new User({
    //             email: req.body.username,
    //             // password: md5(req.body.password)
    //             password: hash
    //         });
    //         user.save((err) => {
    //             if (!err) {
    //                 res.render('secrets');
    //             } else {
    //                 console.log(err);
    //             }
    //         });
    //     } else {
    //         console.log(err);
    //     }
    // });    
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, (err) => {
        if (!err) {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        } else { 
            console.log(err);
            res.redirect('/login');
        }
    });


    // const username = req.body.username;
    // // const password = md5(req.body.password);
    // const password = req.body.password;

    // User.findOne({email: username}, (err, foundUser) => {
    //     if (!err) {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, (err, result) => {
    //                 if (result == true) {
    //                     res.render('secrets');
    //                 } else {
    //                     res.send('Incorect password');
    //                 }
    //             }); 
    //         } else {
    //             res.send('User not found');
    //         }
    //     } else {
    //         console.log(err);
    //     }
    // });
});

app.listen(3000, () => {console.log('Server started');});