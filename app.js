//jshint esversion:6
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const { urlencoded } = require("body-parser");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const secret="thisIsMySecretKeyYouShouldKnow";

mongoose.connect("mongodb://127.0.0.1:27017/userDb");
const userShcema=new mongoose.Schema({
    user:String,
    password:String
});
userShcema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});
const User=new mongoose.model("User",userShcema);

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs")

app.post("/register",function(req,res){
    const user=new User({
        user:req.body.username,
        password:req.body.password
    });
    user.save().then(function(Error){
        if(Error){res.render("secrets.ejs");}else{res.send(Error);}
        
    });
});

app.post("/login",function(req,res){
    const enterUser=req.body.username;
    const enterPassword=req.body.password;
    User.findOne({user:enterUser}).then(function(foundUser,Error){

        if(foundUser){
            if(foundUser.password==enterPassword){
                console.log(foundUser);
                res.render("secrets.ejs");
            }else{
                res.send("check your password and username");}
           
        }
    });
});



app.get("/",function(req,res){
    res.render("home.ejs");
    
});

app.get("/login",function(req,res){
    res.render("login.ejs");
    
});

app.get("/register",function(req,res){
    res.render("register.ejs");
    
});


app.get("/submit",function(req,res){
    res.render("submit.ejs");
    
});


app.listen(3000,function(){
    console.log("app is running is port 3000");
});