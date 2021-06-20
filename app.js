const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));


app.get("/", function (req, res) {
    res.redirect("/home");
})

app.get("/home",function(req,res)
{
  res.render("home",{})
  
})

app.get("/products",function(req,res)
{
  res.render("products",{})
  
})
app.get("/contactus",function(req,res)
{
  res.render("contactus",{})
  
})
app.get("/foundersnote",function(req,res)
{
  res.render("foundersnote",{})
  
})
app.get("/ourstory",function(req,res)
{
  res.render("ourstory",{})
  
})
app.get("/blog",function(req,res)
{
  res.render("blog",{})
  
})







app.listen(process.env.PORT || 3000, (req, res) => {
    console.log("server started")
})