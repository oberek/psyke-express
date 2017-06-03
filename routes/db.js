/**
 * Created by tfeue on 5/19/2017.
 */
var express = require('express');

var mongoose = require('mongoose');

/*change this later with the live code*/
var mongoDB = 'mongodb://127.0.0.1/my_database';

mongoose.connect(mongoDB);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;


var RoomSchema = Schema({
    room_id: String,
    room_name: String,
    online_members: [String],
    log: []
});

var UserSchema = Schema({
    id: String,
    username: String,
    password: String,
    rooms: []
});

var Room = mongoose.model('Room', RoomSchema);
var User = mongoose.model('User', UserSchema);

// var dummy_data = {
//     rooms: {
//         'public': {
//             room_id: 'public',
//             room_name: 'Public Room',
//             online_members: [],
//             log: []
//         },
//         'room-1': {
//             room_id: 'room-1',
//             room_name: 'Room 1',
//             online_members: [],
//             log: []
//         },
//         'second-room': {
//             room_id: 'second-room',
//             room_name: 'Second Room',
//             online_members: [],
//             log: []
//         }
//     },
//     users: {
//         'h3mJptTkQnYBNJf6': {
//             id: 'h3mJptTkQnYBNJf6',
//             username: "samsepi0l",
//             rooms: ['room-1', 'second-room'],
//             password: 'mr.r0b0t'
//         },
//         'vM3RP9huAdiitHyV': {
//             id: 'vM3RP9huAdiitHyV',
//             username: "D0loresH4ze",
//             rooms: ['room-1'],
//             password: 's0m3th1ng_cl3v3r'
//         },
//         'ZdEaOWTamXcTUJa3': {
//             id: 'ZdEaOWTamXcTUJa3',
//             username: 'admin',
//             rooms: ['public', 'room-1', 'second-room'],
//             password: 'password'
//         }
//     }
// };
//
// (function () {
//     var i;
//     for (i = 0; i < Object.keys(dummy_data.users).length; i++) {
//         var room = dummy_data.rooms[Object.keys(dummy_data.rooms)[i]];
//         var room_inst = new Room(room);
//         room_inst.save(function (err) {
//             if (err) console.error.bind(console, 'MongoDB save error:');
//         });
//         //        console.log(room, room_inst);
//     }
//     for (i = 0; i < Object.keys(dummy_data.users).length; i++) {
//         var user = dummy_data.users[Object.keys(dummy_data.users)[i]];
//         var user_inst = new User(user);
//         user_inst.save(function (err) {
//             if (err) console.error.bind(console, 'MongoDB save error:');
//         });
//         //        console.log(user, user_inst);
//     }
// })();
//module.exports = db;
module.exports = {
    User: User,
    Room: Room
};
