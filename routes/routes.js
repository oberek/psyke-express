var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/data');
var psykeSchema = mongoose.Schema;
var mdb = mongoose.connection;
mdb.on('error', console.error.bind(console, 'connection error:'));
mdb.once('open', function (callback) {
});

var UserSchema = new psykeSchema({
    userID: int,
    userName: string,
    password: string
});

var RoomSchema = new psykeSchema({
    roomID: int,
    roomName: string
});

var MembershipSchema = new psykeSchema({
    roomID: RoomSchema.roomID,
    userID: UserSchema.userID
});

var User = mongoose.model('User', UserSchema);
var Room = mongoose.model('Room', RoomSchema);
var Membership = mongoose.model('Membership', MembershipSchema);
