
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret: "this is alittle secret note.",
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


//mongoose declration //////////////////////////////

mongoose.connect("mongodb://127.0.0.1:27017/userDb");

const userShcema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String
});

userShcema.plugin(passportLocalMongoose);
userShcema.plugin(findOrCreate);
const User = new mongoose.model("User", userShcema);

// passport serirlization and deserialization ///////////////
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// passport.serializeUser(function(user, done) {
//     done(null, user.id); 


// passport.deserializeUser(function(id, done) {
//     User.findById(id).then(function(err, user) {
//         done(err, user);}) 
//     });



// google strategy /////////////////////////////////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            // Find or create user in your database
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                // Create new user in database
                const username = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : '';
                const newUser = new User({
                    username: profile.displayName,
                    googleId: profile.id
                });
                user = await newUser.save();

            }

            return done(null, user);

        } catch (err) {

           return done(err);
        }
    }
    // function (accessToken, refreshToken, profile, cb) {
    //     User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //         return cb(err, user);
    //     });
    // }
));
passport.use(new FacebookStrategy({
    clientID: process.env.F_APPID,
    clientSecret: process.env.F_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secret"
},
 async function (accessToken, refreshToken, profile, done) {
        try {
            // Find or create user in your database
            let user = await User.findOne({ facebookId: profile.id });
            if (!user) {
                // Create new user in database
                console.log(profile);
                const username = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : '';
                const newUser = new User({
                    username: profile.displayName,
                    facebookId: profile.id
                });
                user = await newUser.save();

            }

            return done(null, user);
            // console.log(user);

        } catch (err) {

            return done(err);
        }
    }
    ));

//////////////app. post methods //////////////////////////

app.post("/register", function (req, res) {
        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secret");
                });

            }
        });


    });



// app.post('/login',
//     passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
//     function (req, res) {
//         res.redirect("/secret");
//     });
app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secret");
            });
        }
    });

});


/////////app. get methods ///////////////////////////////
app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] }));

app.get("/auth/google/secret",
    passport.authenticate("google", { failureRedirect: '/login', successRedirect: "/secret" }),
    function (req, res) {
        // Successful authentication, redirect secret.
        if (Error) {
            console.log("i am /auth/google/secret if part ");
            console.log(Error);
        } else {
            console.log("i /auth/google/secret else part ");
            res.redirect("/secret");
        }

    });

app.get("/auth/facebook",
    passport.authenticate("facebook"));

app.get("/auth/facebook/secret",
    passport.authenticate("facebook", { failureRedirect: '/login', successRedirect: "/secret" }),
    function (req, res) {
        // Successful authentication, redirect secret.
        if (Error) {
            console.log("i am /auth/facebook/secret if part ");
            console.log(Error);
        } else {
            console.log("i /auth/facebook/secret else part ");
            res.redirect("/secret");
        }

    });
app.get("/login", function (req, res) {
    res.render("login.ejs");

});

app.get("/register", function (req, res) {
    res.render("register.ejs");
});

app.get("/secret", function (req, res) {
    // res.render("secrets.ejs");
    if (req.isAuthenticated()) {
        res.render("secrets.ejs");
        console.log("i am here ");
    } else {
        res.redirect("/login");
    }
});

app.get("/", function (req, res) {
    res.render("home.ejs");

});




app.get("/logout", function (req, res, next) {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        } else {
            res.redirect("/");
        }
    })

});







app.get("/submit", function (req, res) {
    res.render("submit.ejs");

});


app.listen(3000, function () {
    console.log("app is running is port 3000");
});