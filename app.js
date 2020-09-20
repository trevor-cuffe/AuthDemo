const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", 'ejs');

//fix mongoose deprecation warnings:
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
//connect to database:
mongoose.connect("mongodb://localhost:27017/auth_demo");



//ROUTES

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/secret", (req, res) => {
	res.render("secret");
});




app.listen(3000, () => {
	console.log('Server running on port 3000');
})