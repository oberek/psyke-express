var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
// mongoose.connect('mongodb://projectgroup:neumont@ds161931.mlab.com:61931/psyke-react');
mongoose.connect('mongodb://localhost:27017/data');
var Schema = mongoose.Schema;
var mdb = mongoose.connection;
mdb.on('error', console.error.bind(console, 'connection error:'));
mdb.once('open', function (callback) {
});

var UserSchema = new Schema({
    id: {
        type: String,
    },
    userName: {
        type:String,
    },
    rooms: [{
        type:String,
        ref:'Room'
    }],
    password:{
        type:String,
    }
});

var RoomSchema = new Schemea({
    room_id: {
        type: String,

    },
    room_name:{
        type:String,
    },
    online_memebers:[{
        type:String,
        ref:'User'
    }],
    log: [{
        type:String,
    }]

});

var MembershipSchema = new Schema({
    roomID: RoomSchema.roomID,
    userID: UserSchema.userID
});

module.exports = mongoose.model('User', UserSchema);
module.exports = mongoose.model('Room', RoomSchema);
module.exports = mongoose.model('Membership', MembershipSchema);
