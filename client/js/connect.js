import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Accounts } from 'meteor/accounts-base';

import '../connect.html';

import './router.js';

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


Template.connect.onCreated(function(){

  this.avatarFeatures = new ReactiveVar({
    hasHair: true,
    hasHatColor: false,
    hasFacialHair: true
  });
  this.avatarSrc = new ReactiveVar("https://avataaars.io/?avatarStyle=Circle");

});

/* HELPERS */

Template.connect.helpers({

    avatarFeatures: function(){
      return Template.instance().avatarFeatures.get();
    },
    avatarSrc: function(){
      return Template.instance().avatarSrc.get();
    }
  
  });

  /* EVENTS */

  Template.connect.events({

    'submit #login': function(event) {
      event.preventDefault();
      const email = document.querySelector('#login input[name="email"]').value;
      const password = document.querySelector('#login input[name="password"]').value;
      Meteor.loginWithPassword(email, password, function(error) {
        if(error){
          toastr.error(error.message);
        }else{
          FlowRouter.go("/home");
        }
      });
    }, // end login
  
    'change #signUp select': function(){
      const features = {};
      if(document.querySelector("#topType").value.match(/Nohair|Hat|Hijab|Turban|Hat[1-4]/)){
        features.hasHair = false;
        const topType = document.querySelector("#topType").value;
        switch(topType){
          case "Hijab":
            features.hasFacialHair = false;
            features.hasHatColor = true;
            break;
          case "Turban":
          case "WinterHat1":
          case "WinterHat2":
          case "WinterHat3":
          case "WinterHat4":
            features.hasHatColor = true;
            break;
        } // end switch
      }else{
        features.hasHair = true;
        features.hasHatColor = false;
        features.hasFacialHair = true;
      } // end if
      Template.instance().avatarFeatures.set(features);
    }, // end change avatar fields
  
    'click #avatarGen': function(event){
      event.preventDefault();
      const topType = document.querySelector("#topType").value;
      const accessoriesType = document.querySelector("#accessoriesType").value;
      let hairColor = "";
      let hatColor = "";
      let facialHairType = "";
      if(document.querySelector("#hairColor")){
        hairColor = document.querySelector("#hairColor").value;
      }
      if(document.querySelector("#hatColor")){
        hatColor = document.querySelector("#hatColor").value;
      }
      if(document.querySelector("#facialHairType")){
        facialHairType = document.querySelector("#facialHairType").value;
      }
      const clotheType = document.querySelector("#clotheType").value;
      const eyeType = document.querySelector("#eyeType").value;
      const eyebrowType = document.querySelector("#eyebrowType").value;
      const mouthType = document.querySelector("#mouthType").value;
      const skinColor = document.querySelector("#skinColor").value;
      const src = `https://avataaars.io/?avatarStyle=Circle&topType=${topType}&accessoriesType=${accessoriesType}&hatColor=${hatColor}&hairColor=${hairColor}&facialHairType=${facialHairType}&clotheType=${clotheType}&eyeType=${eyeType}&eyebrowType=${eyebrowType}&mouthType=${mouthType}&skinColor=${skinColor}`;
      document.querySelector("#avatarImg").src = src;
      Template.instance().avatarSrc.set(src);
    }, // end click avatarGen
  
    'submit #signUp': function(event){
      event.preventDefault();
      const username = document.querySelector('#signUp input[name="username"]').value;
      const email = document.querySelector('#signUp input[name="email"]').value;
      const password = document.querySelector('#signUp input[name="password"]').value;
      const avatarSrc = Template.instance().avatarSrc;
      Accounts.createUser({
        username: username,
        email: email,
        password: password
      }, function(error) {
        if(error){
          toastr.error(error.message);
        }else{
          // Ajout d'un champ victories pour l'utilisateur nouvellement créé
          Meteor.call("updateVictories", function(error, success){
            if(error){
              toastr.error(error.message);
            }
          }); // end updateVictories
          Meteor.call("updateAvatar", avatarSrc, function(error, success){
            if(error){
              toastr.error(error.message);
            }
          }); // end updateAvatar
          Meteor.call("updateUserGames", "", function(error, success){
            if(error){
              toastr.error(error.message);
            }
          });
          FlowRouter.go("/home");
        } // end if
      }); // end createUser
    } // end sign up
    
  }); // end connect events