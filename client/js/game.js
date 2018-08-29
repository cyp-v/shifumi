import { Template } from 'meteor/templating';

import '../game.html';

import './router.js';

// import './stylesheets/game.css';

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
const toastrCustom = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-top-center",
    "preventDuplicates": true,
    "onclick": function(e){
        // Si l'utilisateur préfère attendre en cas d'inactivité ou de déconnexion de son adversaire, suppression du toast
        if(e.target.classList.contains("clearToast")){
            let toRemove = e.target.parentElement.parentElement.parentElement;
            toRemove.parentElement.removeChild(toRemove);
        // Si l'utilisateur préfère annuler la partie, suppression de la room puis suppression du toast
        }else if(e.target.classList.contains("cancelGame")){
            let toRemove = e.target.parentElement.parentElement.parentElement;
            toRemove.parentElement.removeChild(toRemove);
            Meteor.call("removeRoom", roomId, function(error){
                if(error){
                    toastr.error(error.message);
                }else{
                    toastr.success("La partie a bien été supprimée.");
                }
            }); // end removeRoom
        }
    },
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "0",
    "extendedTimeOut": "0",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut",
    "tapToDismiss": false
};
toastr.options = toastrBasic;


Template.game.onRendered(function(){
    const roomId = FlowRouter.getParam("roomId");
    const otherPlayerId = function(){
        if(roomId){
            const room = rooms.findOne(roomId);
            if(Meteor.userId() === room.challenger.id){
                return room.challengee.id;
            }else{
                return room.challenger.id;
            }
        }
    }; // end function
    const otherPlayerCursor = Meteor.users.find({_id: otherPlayerId()});
    otherPlayerCursor.observeChanges({
        changed: function(id, fields){
            // Timer pour s'assurer que la connexion du joueur adverse est rétablie en cas de micro-coupure
            Meteor.setTimeout(function(){
                const otherPlayer = Meteor.users.findOne(otherPlayerId());
                const otherPlayerName = otherPlayer.username;
                toastr.options = toastrCustom;
                if(fields.status === "offline" && otherPlayer.status === "offline" && Meteor.user().status !== "offline"){
                    toastr.warning(`${otherPlayerName} est déconnecté.\nAnnuler la partie ? <button class='btn clear cancelGame'>Oui</button> <button class='btn clear clearToast'>Non, attendre</button>`);
                }else if(fields.status === "away" && otherPlayer.status === "away" && Meteor.user().status !== "offline"){
                    toastr.warning(`${otherPlayerName} est inactif.\nAnnuler la partie ? <button class='btn clear cancelGame'>Oui</button> <button class='btn clear clearToast'>Non, attendre</button>`);
                }else if(fields.status === "online" && otherPlayer.status === "online" && Meteor.user().status !== "offline"){
                    toastr.options = toastrBasic;
                    toastr.success(`${otherPlayerName} est de retour en ligne !`);
                }
            }, 3000); // end setTimeout
        } // end changed
    }); // end observeChanges
}); // end onRendered

/* HELPERS */

Template.game.helpers({

    room: function(){
        const roomId = FlowRouter.getParam("roomId");
        return rooms.findOne(roomId);
    },
    otherPlayer: function(room){
        if(room){
            if(Meteor.userId() === room.challenger.id){
                return Meteor.users.findOne(room.challengee.id);
            }else{
                return Meteor.users.findOne(room.challenger.id);
            }
        }
    },
    getCurrentMove: function(playerId){
        const roomId = FlowRouter.getParam("roomId");
        const room = rooms.findOne(roomId);
        if(room.challenger.id === playerId){
            return room.challenger.currentMove;
        }else{
            return room.challengee.currentMove;
        }
    },
    getCurrentScore: function(playerId){
        const roomId = FlowRouter.getParam("roomId");
        const room = rooms.findOne(roomId);
        if(room.challenger.id === playerId){
            return room.challenger.score;
        }else{
            return room.challengee.score;
        }
    },
    isRoundOver: function(){
        const roomId = FlowRouter.getParam("roomId");
        const room = rooms.findOne(roomId);
        if(room.status === "ending"){
            return true;
        }
        return false;
    }
});

Template.boardMessage.helpers({

    gameStateChangeListener: function(){
        const roomId = FlowRouter.getParam("roomId");
        const roomCursor = rooms.find({_id: roomId});
        const room = rooms.findOne(roomId);
        const game = Template.instance();
        const moves = document.getElementsByClassName("move");
        const userMove = "";
        const playerMove = "";

        roomCursor.observeChanges({
            changed: function(id, fields){
                // Si c'est le champ "hasStarted" de la room qui a été modifié
                if(fields.hasStarted){
                    let counter = 3;
                    const countToThree = function(){
                        if(counter >= 1){
                            Meteor.setTimeout(function(){
                                game.firstNode.textContent = counter;
                                counter--;
                                countToThree();
                            }, 1000);
                        }else{
                            Meteor.call("updateRoomStatus", roomId, "on", function(error, success){
                                if(error){
                                    toastr.error(error.message);
                                }else{
                                    Meteor.setTimeout(function(){
                                        game.firstNode.textContent = "A vous de jouer !";
                                    }, 1000);
                                } // end if
                            }); // end call
                        } // end if
                    }; // end counToThree;
                    countToThree();
                } // end if
            }, // end changed
            removed: function(id){
                toastr.options = toastrBasic;
                toastr.warning("La partie a été supprimée");
                // redirection après 2 secondes
                Meteor.setTimeout(function(){
                    if(document.location.href.match(roomId)){
                        FlowRouter.go("/home");
                    } // end if
                }, 2000);
            } // end removed
        }); // end observeChanges

        if(room.status === "on" || room.status === "ending"){
            // Si l'un des joueurs a joué un coup
            if((room.challenger.currentMove && !room.challengee.currentMove) || (room.challengee.currentMove && !room.challenger.currentMove)){
                let currentPlayerId = "";
                let otherPlayerId = "";
                // Si c'est le challenger qui a joué
                if(room.challenger.currentMove && !room.challengee.currentMove){
                    currentPlayerId = room.challenger.id;
                    otherPlayerId = room.challengee.id;
                // Si c'est le challengee qui a joué
                }else{
                    currentPlayerId = room.challengee.id;
                    otherPlayerId = room.challenger.id;
                }
                if(currentPlayerId === Meteor.userId()){
                    Meteor.setTimeout(function(){
                        game.firstNode.textContent = "Vous avez joué.\n En attente de " + Meteor.users.findOne(otherPlayerId).username;
                    }, 10);
                }else{
                    Meteor.setTimeout(function(){
                        game.firstNode.textContent = Meteor.users.findOne(currentPlayerId).username + " a joué.\n À vous !";
                    }, 10);
                }
            // Si les deux joueurs on joué
            }else if(room.challenger.currentMove && room.challengee.currentMove){
                const whichIdWins = function(challengerId, challengeeId){
                    const challengerMove = room.challenger.currentMove;
                    const challengeeMove = room.challengee.currentMove;
                    let winnerId = "";
                    if(challengerMove === "rock" && challengeeMove === "paper"){
                        winnerId = challengeeId;
                    }else if(challengerMove === "paper" && challengeeMove === "rock"){
                        winnerId = challengerId;
                    }else if(challengerMove === "rock" && challengeeMove === "scissors"){
                        winnerId = challengerId;
                    }else if(challengerMove === "scissors" && challengeeMove === "rock"){
                        winnerId = challengeeId;
                    }else if(challengerMove === "paper" && challengeeMove === "scissors"){
                        winnerId = challengeeId;
                    }else if(challengerMove === "scissors" && challengeeMove === "paper"){
                        winnerId = challengerId;
                    }else if(challengerMove === challengeeMove){
                        return null;
                    }
                    return winnerId;
                };
                if(room.status === "on"){
                    Meteor.setTimeout(function(){
                        game.firstNode.innerHTML = "<img src='/images/spinner.gif' alt='spinner' style='width:150px'>";
                    }, 10);
                    Meteor.setTimeout(function(){
                        Meteor.call("updateRoomStatus", roomId, "ending", function(error, success){
                            if(error){
                                toastr.error(error.message);
                            }
                        });
                    }, 1500);
                }else if(room.status === "ending"){
                    // On détermine quel est l'ID du gagnant
                    let winnerId = whichIdWins(room.challenger.id, room.challengee.id);
                    // Si l'utilisateur est gagnant
                    if(Meteor.userId() === winnerId){
                        Meteor.setTimeout(function(){
                            game.firstNode.textContent = "Gagné !";
                        }, 5);
                    // S'il y a égalité (démarrage d'une nouvelle partie)
                    }else if(winnerId === null){
                        Meteor.setTimeout(function(){
                            game.firstNode.textContent = "Egalité";
                        }, 5);
                    // Si l'utilisateur est perdant
                    }else{
                        Meteor.setTimeout(function(){
                            game.firstNode.textContent = "Perdu !";
                        }, 5);
                    }
                    // Définit la marche à suivre selon le résultat
                    Meteor.setTimeout(function(){
                        Meteor.call("sortEndOfGame", roomId, winnerId, function(error, needsReset){
                            if(error){
                                toastr.error(error.message);
                            }else{
                                if(needsReset){
                                    // lancement d'une nouvelle manche
                                    game.firstNode.textContent = "Préparez-vous pour la prochaine manche...";
                                    // Lancement de la partie et du compte à rebours
                                    Meteor.call("startGame", roomId, function(error, success){
                                        if(error){
                                            toastr.error(error.message);
                                        }else{
                                            for(let i=0; i<moves.length; i++){
                                                // On débloque les coups
                                                moves[i].classList.remove("blocked");
                                            }
                                        }
                                    });
                                }else{
                                    // Conclusion de la partie
                                    // Mise à jour du nombre de victoires du gagnant
                                    if(winnerId === Meteor.userId()){
                                        Meteor.call("updateVictories", function(error){
                                            if(error){
                                                toastr.error(error.message);
                                            }
                                            game.firstNode.textContent = "Vous remportez cette partie !";
                                        }); // end call updateVictories
                                    }else{
                                        // Annonce du résultat final au perdant
                                        game.firstNode.textContent = "Vous avec perdu cette partie.";
                                    } // end 
                                    // Suppression de la room et redirection vers la home 
                                    Meteor.setTimeout(function(){
                                        Meteor.call("removeRoom", roomId, function(error){
                                            if(error){
                                                toastr.error(error.message);
                                            }else{
                                                toastr.success("La partie a bien été supprimée");
                                            }
                                        }); // end call removeRoom
                                        if(document.location.href.match(roomId)){
                                            FlowRouter.go("/home");
                                        } // end if
                                    }, 2000);
                                } // end if needsReset
                            } // end if success
                        }); // end call sortEndOfGame
                    }, 1500);
                // Si l'utilisateur est perdant
                } // end if room.status === "ending"
            } // end if
        } // end if room.status === ("on" || "ending")
    } // end gameStateChangeListener

});

/* EVENTS */

Template.game.events({

    'click .move': function(event){
        event.preventDefault();
        const roomId = FlowRouter.getParam("roomId");
        const room = rooms.findOne(roomId);
        const moves = document.getElementsByClassName("move");
        const move = event.target.parentElement.id;
        let role = "";
        // Définition du rôle de l'utilisateur
        if(Meteor.userId() === room.challenger.id){
            role = "challenger";
        }else{
            role = "challengee";
        }
        // Si l'utilisateur a déjà joué, on l'empêche de rejouer
        if(room[role].currentMove){
            for(let i=0; i<moves.length; i++){
                moves[i].classList.add("blocked");
            }
        }
        if(room.status === "on" && !event.target.parentElement.classList.contains("blocked")){
            // On enregistre le coup joué par l'utilisateur
            Meteor.call("setMove", roomId, role, move, function(error, success){
                if(error){
                    toastr.error(error.message);
                }else{
                    for(let i=0; i<moves.length; i++){
                        moves[i].classList.add("blocked");
                    }
                }
            });
        }else if(!event.target.parentElement.classList.contains("blocked")){
            toastr.options = {
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
            toastr.warning("La partie n'a pas encore commencé");
        }else{
            toastr.warning("Vous avez déjà joué");
        }
    } // end click move

});

Template.boardMessage.onRendered(function(){

    const roomId = FlowRouter.getParam("roomId");
    const room = rooms.findOne(roomId);
    const messageBoard = document.querySelector("#messageBoard span");
    let hasStarted = room.hasStarted;

    // Si la partie n'est pas encore lancée
    if(!hasStarted){
        // ...lorsque le 2e joueur rejoint la partie
        if(Meteor.userId() === room.challenger.id){
            // Lancement de la partie et du compte à rebours
            Meteor.call("startGame", roomId, function(error, success){
                if(error){
                    toastr.error(error.message);
                }
            });
        // ...lorsque le 1er joueur rejoint la partie
        }
        else if(Meteor.userId() === room.challengee.id){
            this.firstNode.textContent = `En attente de ${Meteor.users.findOne(room.challenger.id).username}`;
        }  
    // Si la partie a commencé mais personne n'a encore joué
    }else if(room.status === "on" && (!room.challenger.currentMove && !room.challengee.currentMove)){
        // Timer pour s'assurer que la partie a eu le temps de changer d'état
        Meteor.setTimeout(function(){
            messageBoard.textContent = "A vous de jouer !";
        }, 10);
    } // end if

});