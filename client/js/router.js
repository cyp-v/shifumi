import { rooms } from '../../lib/rooms';
  
FlowRouter.route("/(|home|connect)", {
  action: function(){
    if(Meteor.userId()){
      BlazeLayout.render("home");
    }else{
      BlazeLayout.render("connect");
    }
  }
});

FlowRouter.route("/game/:roomId", {
  action: function(params, queryParams){
    if(Meteor.userId()){
      Meteor.setTimeout(function(){
        if(rooms.findOne({_id: params.roomId})){
          BlazeLayout.render("game");
        }else{
          BlazeLayout.render("not-found", {message: "La partie que vous recherchez n'existe pas ou a été supprimée."});
        }
      }, 1000);
    }else{
      BlazeLayout.render("connect");
    }
  }
});

FlowRouter.notFound = {
  action(){
    BlazeLayout.render("not-found", {message: "Cette page n'existe pas."});
  }
};