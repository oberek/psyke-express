/**
 * Created by tfeue on 5/19/2017.
 */
var express = require('express');

var mongoose = require('mongoose');
var CryptoJS = require('crypto-js');

// /*change this later with the live code*/
// var mongoDB = 'mongodb://127.0.0.1/my_database';
// var mongoDB = 'mongodb://psyke-tenurian.c9users.io/my_database';

// mongoose.connect('mongodb://127.0.0.1/my_database');
mongoose.connect('mongodb://projectgroup:neumont@ds161931.mlab.com:61931/psyke-react');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;


var RoomSchema = Schema({
    // room_id: String,
    room_name: {type: String, required: true, unique: true},
    online_members: [String],
    log: [{
        type: String,
        msg: String,
        sender: String
    }]
});

var UserSchema = Schema({
    username: {type: String, required: true, unique: true},
    password: {type: Object, required: true},
    rooms: []
});

var Room = mongoose.model('Room', RoomSchema);
var User = mongoose.model('User', UserSchema);

var dummy_data = {
    rooms: [
        {
            room_name: 'Public Room',
            online_members: [],
            log: []
        }
        //,
        // {
        //     room_name: 'Room 1',
        //     online_members: [],
        //     log: []
        // },
        // {
        //     room_name: 'Second Room',
        //     online_members: [],
        //     log: []
        // }
    ]
    ,
    users: [
        // {
        //     username: "samsepi0l",
        //     rooms: [],
        //     password: 'mr.r0b0t'
        // },
        // {
        //     username: "D0loresH4ze",
        //     rooms: [],
        //     password: 's0m3th1ng_cl3v3r'
        // },
        // {
        //     username: 'admin',
        //     rooms: [],
        //     password:  CryptoJS.AES.encrypt('password',  'brad has nine toes')
        // }
    ]
};

(function () {
    for (var i = 0; i < dummy_data.rooms.length; i++) {
        (function () {
            var room = dummy_data.rooms[i];
            Room.findOne({room_name: room.room_name}).exec(function (err, roomFound) {
                if (err) throw err;
                if (roomFound) {
                    console.log("Room already exists");
                } else {
                    var room_inst = new Room(room);
                    room_inst.save(function (err) {
                        if (err) throw err;
                        console.log('Saved a room');
                    });
                }
            });
        })();
    }
    // for (i = 0; i < dummy_data.users.length; i++) {
    //     var user = dummy_data.users[i];
    //
    //     User.findOne({username: user.username}).exec(function (err, usr) {
    //         if (err) throw err;
    //
    //         if (usr) {
    //             console.log("User already exists");
    //         } else {
    //             var user_inst = new User(user);
    //             Room.findOne({room_name: 'Public Room'}).exec(function (err, room) {
    //                 if (err) throw err;
    //                 // var room = rm.toJSON();
    //                 user_inst.rooms.push(room);
    //                 user_inst.save(function (err) {
    //                     if (err) console.error.bind(console, 'MongoDB save error:');
    //                     console.log("Added user");
    //                 });
    //             });
    //         }
    //     });
    //     //        console.log(user, user_inst);
    // }
})();
//module.exports = db;
module.exports = {
    User: User,
    Room: Room
};
