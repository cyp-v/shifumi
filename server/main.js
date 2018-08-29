import { Meteor } from 'meteor/meteor';
import { rooms } from '../lib/rooms';

Meteor.startup(() => {

  /* PUBLICATIONS */
  
  Meteor.publish("userData", function(){
    return Meteor.users.find(
      {_id: this.userId}, 
      {fields: 
        {
          username: 1,
          victories: 1,
          avatar: 1,
          challenges: 1
        }
      }
    );
  });
  UserPresenceMonitor.start();
	UserPresence.activeLogs();
  UserPresence.start();

}); // end Meteor.startup()

Meteor.publish("allUsersData", function(){
  return Meteor.users.find(
    {}, 
    {fields: 
      {
        status: 1, 
        statusDefault: 1, 
        statusConnection: 1, 
        username: 1,
        victories: 1,
        avatar: 1,
        challenges: 1
      }
    }
  );
});

Meteor.publish('rooms', function() {
  return rooms.find({}); 
});

/* METHODS */

Meteor.methods({

  // Suppression du compte utilisateur
  "deleteAccount": function(){
    if(Meteor.user()){
      if(Meteor.users.remove(Meteor.userId())){
        return {status: "success"};
      }else{
        return new Meteor.Error("Le compte utilisateur n'a pas pu être supprimé.")
      }
    }else{
      return new Meteor.Error("Aucun utilisateur connecté");
    }
  }, // end deleteAccount

  // Mise à jour du nombre de victoires
  "updateVictories": function(){
    if(Meteor.user()){
      let victoriesCount = 0;
      if(Meteor.users.findOne({_id: Meteor.userId()}).victories > -1){
        victoriesCount = Meteor.users.findOne({_id: Meteor.userId()}).victories + 1;
      }
      if(Meteor.users.update(Meteor.userId(), {$set: {victories: victoriesCount}})){
        return {status: "success"};
      }else{
        throw new Meteor.Error("Le nombre de victoires n'a pas pu être mis à jour dans la base de données.");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end updateVictories

  "updateAvatar": function(avatarSrc){
    if(Meteor.user()){
      if(Meteor.users.update(Meteor.userId(), {$set: {avatar: avatarSrc}})){
        return {status: "success"};
      }else{
        throw new Meteor.Error("L'avatar n'a pas pu être mis à jour dans la base de données.");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end updateAvatar

  "createRoom": function(challengeeId, createdAt){
    if(Meteor.user()){
      return rooms.insert({
        challenger : {
          id: Meteor.userId(),
          currentMove: "",
          score: 0
        },
        challengee : {
          id: challengeeId,
          currentMove: "",
          score: 0
        },
        createdAt: createdAt,
        status: "pending"
      });
      throw new Meteor.Error("La salle de jeu n'a pas pu être créée dans la base de données.");
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end createRoom

  "removeRoom": function(roomId){
    if(Meteor.user()){
      // On récupère l'ID de l'autre joueur présent dans la room
      const thisRoom = rooms.findOne(roomId);
      if(thisRoom){
        let otherPlayerId;
        if(thisRoom.challenger.id === Meteor.userId()){
          otherPlayerId = thisRoom.challengee.id;
        }else{
          otherPlayerId = thisRoom.challenger.id;
        }
        // ...et on supprime cette room du profil de chacun des participants
        if(Meteor.users.update({_id: {$in: [Meteor.userId(), otherPlayerId]}}, {$pull: {challenges : roomId}}, {multi: true})){
          if(rooms.remove({_id: roomId})){
            return {satus: "success"};
          }else{
            throw new Meteor.Error("La salle de jeu n'a pas pu être supprimée de la basee de données.")
          }
        }else{
          throw new Meteor.Error("La salle de jeu n'a pas pu être supprimée de la basee de données");
        }
      }else{
        return "La partie n'existe pas ou a déjà été supprimée.";
      } // end if thisRoom
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end removeRoom

  "play": function(roomId){
    if(Meteor.user()){
      if(rooms.update({_id: roomId}, {$set: {status: "accepted"}})){
        return {status: "success"};
      }else{
        throw new Meteor.Error("");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end play

  "updateUserGames": function(roomId){
    if(Meteor.user()){
      // Mise à jour de la propriété "challenges"
      if(roomId){
        if(Meteor.users.update(Meteor.userId(), {$push: {challenges: roomId}})){
          return {status: "success"};
        }else{
          throw new Meteor.Error("Le défi n'a pas pu être ajouté à la liste des défis en cours pour cet utilisateur.");
        }        
      // Ajout de la propriété "challenges" (array) lors de l'inscription d'un nouvel utilisateur
      }else{
        if(Meteor.users.update(Meteor.userId(), {$set: {challenges: []}})){
          return {status: "success"};
        }else{
          throw new Meteor.Error("La liste des défis n'a pas pu être initiée.");
        }
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end updateUserGames

  "updateRoomStatus": function(roomId, status){
    if(Meteor.user()){
      if(rooms.update({_id: roomId}, {$set: {status: status}})){
        return {status: "success"};
      }else{
        throw new Meteor.Error("La salle de jeu n'a pas pu être mise à jour en base de données");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end updateRoomStatus

  "startGame": function(roomId){
    if(Meteor.user()){
      if(rooms.update({_id: roomId}, {$set: {hasStarted: true}})){
        return {status: "success"};
      }else{
        throw new Meteor.Error("La partie n'a pas pu être lancée en base de données");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end startGame

  "setMove": function(roomId, role, move){
    const field = role + ".currentMove";
    if(Meteor.userId()){
        if(rooms.update({_id: roomId}, {$set: {[field]: move}})){
          return {status: "success"};
        }else{
          throw new Meteor.Error("Le coup joué par l'utilisateur n'a pas pu être enregistré dans la partie.");
        }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    }
  }, // end setMove

  "sortEndOfGame": function(roomId, winnerId){
    if(Meteor.user()){
      let challengerScore = rooms.findOne(roomId).challenger.score;
      let challengeeScore = rooms.findOne(roomId).challengee.score;
      let field = "";
      let needsReset = false;

      console.log("challengerScore = " + challengerScore + "  challengeeScore = " + challengeeScore); // DEBUG

      // Si le challenger gagne ce coup
      if(winnerId === rooms.findOne(roomId).challenger.id){
        field = "challenger.score";
        challengerScore++; // (pour simulation avant update)
      // Si le challengee gagne ce coup
      }else if(winnerId === rooms.findOne(roomId).challengee.id){
        field = "challengee.score";
        challengeeScore++; // (pour simulation avant update)
      }
      // Si on n'a pas atteint les 2 manches gagnantes
      if(challengerScore < 2 && challengeeScore < 2){
        needsReset = true;
      }else{
        needsReset = false;
      }

      console.log("challengerScore = " + challengerScore + "  challengeeScore = " + challengeeScore); // DEBUG

      // On reset la partie en mettant à jour les scores
      if(rooms.update(
        {_id: roomId}, 
        // Reset
        {
          $set: 
            {
              hasStarted: false,
              status: "set",
              "challenger.currentMove": "",
              "challengee.currentMove": ""
            }
        }
      )){
        // on success
        if(winnerId && rooms.update(
          {_id: roomId},
          // mise à jour du score 
          {$inc: {[field]: 0.5}}
        )){
          return needsReset;
        // si égalité
        }else if(!winnerId){
          return needsReset;
        }else{
          throw new Meteor.Error("Les scores n'ont pas pu être mis à jour");      }
      }else{
        throw new Meteor.Error("La salle de jeu n'a pas pu être réinitialisée");
      }
    }else{
      throw new Meteor.Error("Aucun utilisateur connecté.");
    } // end if Meteor.user()
  } // end sortEndOfGame

}); // end methods