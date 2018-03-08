/**
 * Created by tfeue on 5/19/2017.
 */
var express = require('express');

var mongoose = require('mongoose');

// mongoose.connect('mongodb://127.0.0.1/my_database');
// mongoose.connect('mongodb://projectgroup:neumont@ds161931.mlab.com:61931/psyke-react');
// mongoose.connect('mongodb://production_user:production_password@ds139817.mlab.com:39817/psyke');
mongoose.connect('mongodb://spoon:970728392FDEC6E63D8EBBF766626EE8FC63AD982D9A6808746B495444C96583@ds113626.mlab.com:13626/psyke-demo');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var UserSchema = Schema({
    username: {type: String, required: true, unique: true},
    password: {type: Object, required: true},
    rooms: []
});
var User = mongoose.model('User', UserSchema);

var RoomSchema = Schema({
    room_name: {type: String, required: true, unique: true},
    online_members: [String],
    log: [{}]
});

var Room = mongoose.model('Room', RoomSchema);

(function () {
    var PublicRoom = {
        room_name: 'Public Room',
        online_members: [],
        log: []
    };
    Room.findOne({room_name: PublicRoom.room_name}).exec(function(err, room){
        if(err) throw err;
        if(room){
            console.log(room.room_name,' already exists.');
        } else {
            var room_inst = new Room(PublicRoom);
            room_inst.save(function(err){
                if(err) throw err;
                console.log("Saved the room '"+PublicRoom.room_name+"'");
            })
        }
    });

})();

module.exports = {
    User: User,
    Room: Room
};
