angular.module("technodeApp").config(function($routeProvider,$locationProvider){
  $locationProvider.when("/",{
    templateUrl:"/pages/room.html",
    controller:"RoomCtrl"
  }).when("/login",{
    templateUrl:"/pages/login.html",
    controller:"LoginCtrl"
  }).otherwise({
    redirectTo:"/login"
  });
})