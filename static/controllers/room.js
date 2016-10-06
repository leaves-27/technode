angular.module("technodeApp").controller("RoomCtrl",function($scope,socket){
  socket.on("roomData",function(room){
    $scope.room = room;
  });

  socket.on("messageAdded",function(message){
    $scope.technode.message.push(message);
  });
  socket.emit("getRoom");
});