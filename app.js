require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const md5 = require('md5');

const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

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
    password: String
});

// Setup mongoose-encryption to encrypt password field in mongodb
// userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, excludeFromEncryption: ['email']});

// Create user schema model
const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (!err) {
            const user = new User({
                email: req.body.username,
                // password: md5(req.body.password)
                password: hash
            });
            user.save((err) => {
                if (!err) {
                    res.render('secrets');
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });    
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    // const password = md5(req.body.password);
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, (err, result) => {
                    if (result == true) {
                        res.render('secrets');
                    } else {
                        res.send('Incorect password');
                    }
                }); 
            } else {
                res.send('User not found');
            }
        } else {
            console.log(err);
        }
    });
});

app.listen(3000, () => {console.log('Server started');});