// var socket = io.connect("/");
// socket.on("connected",function(){
//   alert("connected to technode!");
// });

var app = angular.module("technodeApp",["ngRoute","angularMoment"]).run(function($window,$rootScope,$http,$location){
  $window.moment.lang("zh-cn");
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
