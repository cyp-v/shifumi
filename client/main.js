import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Accounts } from 'meteor/accounts-base';

import './main.html';

import './js/router.js';
import './js/connect.js';
import './js/home.js';
import './js/game.js';
import './js/not-found.js';

/* SUBSCRIPTIONS */

Meteor.subscribe('allUsersData');
Meteor.subscribe("userData");
Meteor.subscribe("rooms");

/* GLOBAL VARIABLES ON DOM READY */

Meteor.startup(function(){
  UserPresence.awayTime = 120000;
  UserPresence.awayOnWindowBlur = false;
  UserPresence.start();
})

/* REACTIVE VARS */

/* HELPERS */

/* EVENTS */

