var express = require("express");
var app = express();
var path = require("path");

var port =  process.env.PORT || 3000;


var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-sessioin");
var Controllers = require("./controllers");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(cookieParser());
app.user(session({
  secret:"technode",
  resve:true,
  saveUninitialized:false,
  cookie:{
    maxAge:60*1000
  }
}));

app.use(express.static(path.join(__dirname,"./static")));
app.use(function(req,res){
  res.sendFile(path.join(__dirname,"./static/index.html"));
});

app.get("/api/validate",function(req,res){
  var userId = req.session.userId;
  if (_userId) {
    Controllers.User.findUserById(_userId,function(err,user){
      if (err) {
        res.json(401,{
          msg:err
        });
      }else{
        res.json(user);
      }
    });
  }else{
    res.json(401,null);
  }
});

app.post("/api/login",function(req,res){
  var email = req.body.email;
  if (email) {
    Controllers.User.findByEmailOrCreate(email,function(err,user){
      if (err) {
        res.json(500,{
          msg:err
        });
      }else{
        req.session._userId =  user._id;
        res.json(user);
      }
    });
  }else{
    res.json(403);
  }
});

app.get("/api/logout",function(req,res){
  req.session._userId = null;
  res.json(401);
});

var server = app.listen(port,function(){
  console.log("technode is on port "+port+"!");
});

var io = require("socket.io").listen(server);

var message = [];

io.sockets.on("connection",function(socket){
  socket.on("connected",function(){
    socket.emit("所有消息",message);
  });
  socket.on("createMessage",function(message){
    socket.push(message);
    io.sockets.emit("messageAdded",message);
  });
});


