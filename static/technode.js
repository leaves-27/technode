// var socket = io.connect("/");
// socket.on("connected",function(){
//   alert("connected to technode!");
// });

var app = angular.module("technodeApp",["ngRoute"]).run(function($window,$rootScope,$http,$location){
  $http({
    url:"/api/validate",
    method:"GET"
  }).success(function(user){
    $rootScope.me = user;
    $location.path("/");
  }).error(function(data){
    $location.path("/login");
  });
  $rootScope.logout = function(){
    $http({
      url:"/ajax/logout",
      method:"get"
    }).success(function(){
      $rootScope.me = null;
      $location.path("/login");
    });
  };
  $rootScope.$on("login",function(evt,me){
    $rootScope.me = me;
  });
});


app.factory("socket",function($rootScope){
  var socket = io.connect("/");
  return {
    on:function(eventName,callback){
      socket.on(eventName,function(){
        var args = arguments;
        $rootScope.$apply(function(){
          callback.apply(socket,args);
        });
      })
    },
    emit:function(eventName,data,callback){
      socket.emit(eventName,data,function(){
        var args = arguments;
        $rootScope.$apply(function(){
          if(callback) {
            callback.apply(socket,args);
          }
        });
      });
    }
  }
});

app.controller("RoomCtrl",function($scope,socket){
  $scope.message = [];
  socket.emit("getAllMessage");

  socket.on("allMessage",function(message){
    $scope.message = message;
  });

  socket.on("messageAdded",function(message){
    $scope.message.push(message);
  });
});

app.controller("MessageCtrl",function($scope,socket){
  $scope.newMessage = "";

  $scope.createMessage = function(){
    if ($scope.newMessage=="") {
      return 
    }
    socket.emit("createMessage",$scope.newMessage);
    $scope.newMessage = "";
  }
});

app.directive("autoScrollToBottom",function(){
  return {
    link:function(scope,element,attrs){
      scope.$watch(function(){
        return element.children().length;
      },function(){
        element.animate({
          scrollTop:element.prop("scrollHeight")
        },1000);
      });
    }
  }
});

app.directive("ctrlEnterBreakLine",function(){
  return function(scope,element,attrs){
    var ctrlDown = false;
    element.bind("keydown",function(evt){
      if (evt.which === 17) {
        ctrlDown = true;
        setTimeout(function(){
          ctrlDown = false;
        },1000);
      }
      if (evt.which === 13) {
        if (ctrlDown) {
          element.val(element.val() + "\n")
        }else{
          scope.$apply(function(){
            scope.$eval(atts.ctrlEnterBreakLine);
          });
          evt.preventDefault();
        }
      }
    })
  }
});