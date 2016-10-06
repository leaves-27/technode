var express = require("express");
var app = express();
var path = require("path");

var port =  process.env.PORT || 3000;


var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var Controllers = require("./controllers");

var signedCookieParse = cookieParser("technode");
var MongoStore = require("connect-mongo")(session);
var sessionStore = new MongoStore({
  url:"mongodb://localhost/technode"
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(cookieParser());
app.use(session({
  secret:"technode",
  resve:true,
  saveUninitialized:false,
  cookie:{
    maxAge:60*1000*60
  },
  store:sessionStore
}));

app.use(express.static(path.join(__dirname,"./static")));
app.use(function(req,res){
  res.sendFile(path.join(__dirname,"./static/index.html"));
});

app.get("/api/validate",function(req,res){
  var _userId = req.session.userId;
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
        Controllers.User.online(user._id,function(err,user){
          if(err){
            res.json(500,{
              msg:err
            });
          }else{
            res.json(user);
          }
        });
        
      }
    });
  }else{
    res.json(403);
  }
});

app.get("/api/logout",function(req,res){
  var _userId = req.session._userId = null;
  Controllers.User.offline(_userId,function(err,user){
    if (err) {
      res.json(500,{
        msg:err
      });
    }else{
      res.json(200);
      delete req.session._userId;
    }
  });
});

var server = app.listen(port,function(){
  console.log("technode is on port "+port+"!");
});

var io = require("socket.io").listen(server);

var message = [];

io.set("authorization",function(handshakeData,accept){
  signedCookieParse(handshakeData,{},function(err){
    if (err) {
      accept(err,false);
    }else{
      sessionStore.get(handshakeData.signedCookies['connect.sid'],function(err,session){
        if (err) {
          accept(err.message,false);
        }else{
          handshakeData.session = session;
          if(session && session._userId) {
            accept(null,true);
          }else{
            accept("no login");
          }
        }
      });
    }
  });
});

io.sockets.on("connection",function(socket){
  var _userId = socket.handshake.session._userId;
  Controllers.User.online(_userId,function(err,user){
    if (err) {
      socket.emit("err",{
        mesg:err
      });
    }else{
      socket.broadcast.emit("online",user);
      socket.broadcast.emit("messageAdded",{
        content:user.name + "进入了聊天室",
        creator:SYSTEM,
        createAt:new Date()
      });
    }
  });

  socket.on("disconnect",function(){
    Controllers.User.offline(_userId,function(err,user){
      if(err){
        socket.emit("err",{
          mesg:err
        });
      }else{
        socket.broadcast.emit("offline",user);
        socket.broadcast.emit("messageAdded",{
          content:user.name + "离开了聊天室",
          creator:SYSTEM,
          createAt:new Date()
        });
      }
    });
  });
  socket.on("online",function(user){
    $scope.room.users.push(user);
  });
  socket.on("offline",function(user){
    _userId = user._id;
    $scope.room.users = $scope.room.users.filter(function(user){
      return user._id != _userId;
    });
  });
  socket.on("connected",function(){
    socket.emit("所有消息",message);
  });
  socket.on("getRoom",function(){
    async.parallel([
      function(done){
        Controllers.User.getOnlineUser(done);
      },
      function(done){
        Controllers.Message.read(done);
      }
    ],
    function(err,results){
      if (err) {
        socket.emit("err",{
          msg:err
        });
      }else{
        socket.emit("roomData",{
          users:results[0],
          messages:results[1]
        });
      }
    });

    Controllers.User.getOnlineUser(function(err,users){
      if (err) {
        socket.emit("err",{
          msg:err
        });
      }else{
        socket.emit("roomData",{
          users:users,
          message:message
        });
      }
    });
  });
  socket.on("createMessage",function(message){
    Controllers.Message.create(function(err,message){
      if (err) {
        socket.emit("err",{
          msg:err
        });
      }else{
        io.sockets.emit("messageAdded",message);
      }
    });
    //messages.push(message);
    //io.sockets.emit("messageAdded",message);
  });
});


