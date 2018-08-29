import { Template } from 'meteor/templating';

import '../home.html';

import './router.js';

import { rooms } from '../../lib/rooms';

// Configurations possibles de toastr
const toastrBasic = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-center",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "4000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};
toastr.options = toastrBasic;

/* HELPERS */

Template.home.helpers({

    getUserById: function(id){
      return Meteor.users.findOne(id);
    },
    availableUsers: function(){
      return Meteor.users.find({
        status: {$in: ["online", "away", "busy"]},
        _id: {$not: Meteor.userId()}
      });
    },
    isAvailable: function(player){
      if(Meteor.userId()){
        const playerChallenges = player.challenges;
        const userChallenges = Meteor.user().challenges;
        // Si ce joueur n'est pas déjà en défi avec l'utilisateur, alors il est considéré comme disponible.
        for(let j=0; j<playerChallenges.length; j++){
          // Si, dans les rooms qui impliquent ce joueur, l'utilisateur est le challengee
          if(rooms.findOne(playerChallenges[j]).challengee.id === Meteor.userId()){
            return false;
          }
        }
        for(var i=0; i<userChallenges.length; i++){
          if(rooms.findOne(userChallenges[i]).challengee.id === player._id){
            return false;
          }
        }
        return true;
      }
    },
    // Les défis impliquant l'utilisateur
    challenges: function(){
      return rooms.find({$or: [{"challenger.id": Meteor.userId()}, {"challengee.id": Meteor.userId()}]});
    },
    // Détermine si l'utilisateur est à l'initiative du défi ou non
    isChallenger: function(challengerId){
      if(challengerId === Meteor.userId()){
        return true;
      }
      return false;
    },
    // Détermine si l'utilisateur peut rejoindre le jeu
    isReady: function(roomId){
      const game = rooms.findOne(roomId);
      if(game.status === "pending" && game.challengee.id === Meteor.userId()){
        return true;
      }else if(game.status === "accepted"){
        return true;
      }
      return false;
    },
    // détermine si la partie est en cours
    isOn: function(roomId){
      const game = rooms.findOne(roomId);
      if(game.status === "set" || game.status === "on"){
        return true;
      }
      return false;
    },
    // détermine si l'utilisateur est disponible (s'il n'est pas déjà dans une partie)
    userIsAvailable: function(){
      const userChallenges = Meteor.user().challenges;
      for(let i=0; i<userChallenges.length; i++){
        if(rooms.findOne(userChallenges[i]).status === "on" || rooms.findOne(userChallenges[i]).status === "set"){
          return false;
        }else{
          return true;
        }
      }
      return true;
    },
    // Les 10 meilleurs joueurs
    bestPlayers: function(){
      return Meteor.users.find({}, {_id: 0, username: 1, victories: 0, sort: {victories: -1}});
    }
  });

  Template.home.events({

    'click #logout': function(event){
      event.preventDefault();
      Meteor.logout(function(error){
        if(error){
          toastr.error(error.message);
        }else{
          toastr.success("Déconnexion réussie.");
          FlowRouter.go("/connect");
        }
      });
    }, // end logout

    'click #deleteAccount': function(event){
      event.preventDefault();
      const valid = confirm("Voulez-vous vraiment supprimer votre compte ?\nVous perdrez votre score.");
      if(valid === true){
        Meteor.call("deleteAccount", function(error){
          if(error){
            toastr.error(error.message);
          }else{
            toastr.success("Votre compte a été supprimé.");
            // redirection après 1 seconde
            Meteor.setTimeout(function(){
              FlowRouter.go("/connect");
            }, 1000); // end setTimeout
          } // end if
        }); // end deleteAccount
      } // end if
    }, // end deleteAccount
  
    'click .challenge': function(event){
      event.preventDefault();
      const challengeeId = event.target.getAttribute("challengeeid");
      const createdAt = Date.now();
      const challengee = Meteor.users.findOne(challengeeId);
      Meteor.call("createRoom", challengeeId, createdAt, function(error, roomId){
        if(error){
          toastr.error(error.message);
        }else{
          // On enregistre la room dans le profil du joueur challenger
          Meteor.call("updateUserGames", roomId, function(error){
            if(error){
              toastr.error(error.message);
            }
          });
        }
      });
    }, // end challenge
  
    'click .cancel': function(event){
      const roomId = event.target.getAttribute("roomid");
      event.preventDefault();
      Meteor.call("removeRoom", roomId, function(error){
        if(error){
          toastr.error(error.message);
        }else{
          toastr.success("Le défi a bien été annulé.");
        }
      });
    }, // end cancel
  
    'click .play': function(event){
      event.preventDefault();
      const roomId = event.target.getAttribute("roomid");
      Meteor.call("play", roomId, function(error){
        if(error){
          toastr.error(error.message);
        }else{
          FlowRouter.go(`/game/${roomId}`);
        }
      });
      // On enregistre la room dans le profil du joueur challengé
      if(rooms.findOne({_id: roomId}).challengee.id === Meteor.userId()){
        Meteor.call("updateUserGames", roomId, function(error){
          if(error){
            toastr.error(error.message);
          }
        });
      }else{
        Meteor.call("updateRoomStatus", roomId, "set", function(error){
          if(error){
            toastr.error(error.message);
          }
        });
      }
    }, // end play

    'click .join': function(event){
      event.preventDefault();
      const roomId = event.target.getAttribute("roomid");
      FlowRouter.go(`/game/${roomId}`);
    }
  });