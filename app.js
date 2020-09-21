import express from "express";
import expressSession from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import bodyParser from "body-parser";
import LocalStrategy from "passport-local";
import passportLocalMongoose from "passport-local-mongoose";

import User from "./models/user.js";

//fix mongoose deprecation warnings:
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
//connect to database:
mongoose.connect("mongodb://localhost:27017/auth_demo");

const app = express();
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(expressSession({
	secret: "This is so random...",
	resave: false,
	saveUninitialized: false
}));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

//======
//ROUTES
//======

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/secret", isLoggedIn, (req, res) => {
	res.render("secret");
});


//Auth Routes

//show sign up form
app.get("/register", (req, res) => {
	res.render("register");
});

//handle user signup
app.post("/register", (req, res) => {
	User.register(new User({username: req.body.username}), req.body.password, (err, user) => {
		if(err) {
			console.error(err);
			res.render('register');
		} else {
			passport.authenticate("local")(req, res, () => {
				res.redirect("/secret");
			});
		}
	});
});

//LOGIN ROUTES
//render login form
app.get("/login", (req, res) => {
	res.render('login');
});

//login logic
app.post("/login", passport.authenticate("local", {
	failureRedirect: "/login"
}), (req, res) => {
	res.redirect("/secret");
});

//Log Out
app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
});



function isLoggedIn(req, res, next) {
	console.log("isLoggedIn called");
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
}



let port = process.env.PORT || 3000;
app.listen(3000, () => {
	console.log(`Server running on port ${port}`);
})