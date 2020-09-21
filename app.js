import express from "express";
import sessions from "client-sessions";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import csrf from "csurf";
import cookieParser from "cookie-parser";

import User from "./models/user.js";

//fix mongoose deprecation warnings:
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
//connect to database:
mongoose.connect("mongodb://localhost:27017/auth_demo");

const app = express();
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(sessions({
	cookieName: "session",
	secret: "asdlkhv9x02k4h1493098dfckzu3l5nzuuuewl2cbi2",
	duration: 30*60*1000	//30 mins
}));
app.use(cookieParser());


//Set standard functions for app requests:
//Set user variable in sessions
app.use((req, res, next) => {
	if (!(req.session && req.session.userId)) {
		return next();
	}

	User.findById(req.session.userId, (err, user) => {
		if (err) {
			return next(err);
		}

		if (!user) {
			return next();
		}

		user.password = undefined;

		req.user = user;
		res.locals.user = user;

		next();
	});
});

function loginRequired(req, res, next) {
	if (!req.user) {
		return res.redirect("/login");
	}

	next();
}

let csrfProtection = csrf({ cookie: true });

// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// app.use(passport.initialize());
// app.use(passport.session());

//======
//ROUTES
//======

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/secret", loginRequired, (req, res) => {
	if (!(req.session && req.session.userId)) {
		res.redirect("/login");
	}

	User.findById(req.session.userId, (err) => {
		if (err) {
			console.log(err);
			res.redirect("/login");
		}
		res.render("secret");
	});

});


//Auth Routes

//show sign up form
app.get("/register", csrfProtection, (req, res) => {
	res.render("register", { csrfToken: req.csrfToken() });
});

//handle user signup
app.post("/register", csrfProtection, (req, res) => {
	let hash = bcrypt.hashSync(req.body.password, 14);
	req.body.password = hash;
	let user = new User(req.body);
	user.save((err) => {
		if(err) {
			console.error(err);
			res.render('register');
		} else {
			res.redirect("/");
		}
	});
});

//LOGIN ROUTES
//render login form
app.get("/login", csrfProtection, (req, res) => {
	res.render('login', { csrfToken: req.csrfToken() });
});

//login logic
app.post("/login", csrfProtection, (req, res) => {
	User.findOne({username: req.body.username}, (err, user) => {
		if (err || !user || !bcrypt.compareSync(req.body.password, user.password)) {
			return res.render("login", {
				error: "Incorrect email/password."
			});
		}
		
		req.session.userId = user._id;
		res.redirect("/secret");
	});
});

//Log Out
app.get("/logout", (req, res) => {
	req.session.userId = null;
	res.redirect("/");
});




let port = process.env.PORT || 3000;
app.listen(3000, () => {
	console.log(`Server running on port ${port}`);
})