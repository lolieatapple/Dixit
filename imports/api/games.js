import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";

export const Games = new Mongo.Collection("games");

if (Meteor.isServer) {
  Meteor.publish("games", function gamesPublication() {
    return Games.find({});
  });
  Meteor.publish("myGame", function f() {
    if (!Meteor.userId()) {
      return this.ready();
    }
    return Games.find({players: Meteor.user().username});
  });
}

Meteor.methods({
  "games.start"(distributedCards, name) {
    check(distributedCards, Array);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    Games.update(
      {name: name}, 
      {$set :{cards: distributedCards}}
    );
  },

  "games.insert"(info) {
    check(info.name, String);
    check(info.cards, Array);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    let res = Games.findOne({
      name: info.name
    });
    if (res!= null) {
      throw new Meteor.Error("nameTaken");
    }
    Games.insert({
      name: info.name,
      numberOfPlayers: info.number,
      okToJoin: true,
      stage:0,
      count:[],
      targetCard: null,
      description:"",
      hostIdx:0,
      winners:[],
      players:[],
      createdAt: Date.now(),
      owner: Meteor.user().username,
      cards:info.cards[0],//arr of arr
      cardsOnDesk:[],
      cardsOnHand:info.cards[1],//arr of arr
    });
  },

  "games.addPlayer"(name) {
    check(name, String);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    let res = Games.findOne({
      name:name
    });
    if (res.players.includes(Meteor.user().username)){
      return;
    }
    Games.update(
      {name: name}, 
      {$push:{players: Meteor.user().username}}
    );
    if (res.players.length === res.numberOfPlayers) {
      console.log("full?");
      Games.update(
        {name: name}, 
        {okToJoin: false}
      );
    }
  },

  "games.getPlayerIndex"(name) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    let res = Games.find({name:name}).players; //current Game players
    return res.indexOf(Meteor.user().username);
  },

  "games.removePlayer"(name) {
    check(name, String);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    let res = Games.findOne({
      name:name
    });
    if (!res.players.includes(Meteor.user().username)){
      return;
    }
    Games.update(
      {name: name}, 
      {$pull: {players: Meteor.user().username}}
    );
  },

  "games.updateReady"(name) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }//CHECK DUPLICATE
    Games.update ({
      name: name
    }, {
      $push:{count: Meteor.user().username}
    }); 
  },

  "games.updateAnswer"(info){
    check(info.game, String);
    check(info.card._id, String);//cardID
    check(info.card._url, String);
    check(info.description, String);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    Games.update ({
      name: info.game
    }, {
      targetCard: info.card,
      description: info.description
    }); 
  },

  "games.addCardToDesk"(info) {
    check(info.game, String);
    check(info.card._id, String);//cardID
    check(info.card._url, String);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    Games.update ({
      name: info.game
    }, {
      $push:{cardsOnDesk: info.card}
    }); 
  },

  "games.updateWinners"(info) {
    check(info.game, String);
    check(info.card._id, String);//cardID
    check(info.card._url, String);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    if (Object.is(info.card, Games.find({name: info.name}).targetCard)){
      Games.update ({
        name: info.game
      }, { //TODO:check duplicate
        $push:{winners: Meteor.user().username}
      });
    }
  }
});








    // let res = Games.findOne({
    //   name:name
    // });
    // if (res.count.length === res.players.length){
    //   if (res.stage === 4) {
    //     if (res.hostIdx === res.players.length - 1) {
    //     //end of the game,delete game
    //     } else { // end of the round,switch next host
    //       Games.update({
    //         name: name
    //       }, {
    //         stage: 1,
    //         count: [],
    //         $inc: {
    //           hostInx: 1
    //         }
    //       });
    //     }
    //   } else { //when cur stage = 0-3
    //     Games.update ({
    //       name: name
    //     }, {
    //       count: [],
    //       $inc: {
    //         stage: 1
    //       }
    //     }); 
    //   }
    // }

// "games.removePlayer"(gameName) {
//   if (!this.userId) {
//     throw new Meteor.Error("not-authorized");
//   }
//   Games.update(
//     {name: gameName}, 
//     {$pull: {players: Meteor.user().username}}
//   );
// },
//   "games.getGame"(gameName) {
//   check(gameName, String);
//   if (!this.userId) {
//     throw new Meteor.Error("not-authorized");
//   }
//   Games.findOne({
//     gameName: gameName
// });



