var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ExpressPeerServer = require('peer').ExpressPeerServer;
var db = require('./routes/db');

var app = express();

var PORT = normalizePort(process.env.port || '8080');

app.set('port', PORT);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(PORT);
peerServer = ExpressPeerServer(server, options);

app.use('/api/', peerServer);

var options = {
    debug: true
};

app.post('/login', function (req, res) {
    db.User.findOne({username: req.body.username}).exec(function (err, user) {
        if (err) throw err;

        if (user !== null) {
            if (user.password === req.body.password) {
                var response = Object.assign({}, user.toJSON());
                delete response.password;
                response._id = user._id;
                res.send(JSON.stringify(response));
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(404);
        }

    });
});

app.post('/connect', function (req, res) {
    var room_id = req.body.room_id;
    var user_id = req.body.user_id;

    db.User.findOne({_id: user_id}).exec(function (err, user) {
        if (err) throw err;
        for (var i = 0; i < user.rooms.length; i++) {
            (function () {
                var r_id = user.rooms[i]._id;
                db.Room.findOne({_id: r_id}).exec(function (err, room) {
                    if (err) throw err;

                    if (room) {

                        if (room._id.toString()===room_id && room.online_members.indexOf(user._id) === -1) {
                            room.online_members.push(user._id);
                            room.markModified('propChanged');

                            room.save(function (err) {
                                if(err) throw err;
                            });

                        } else if (room._id.toString() !== room_id && room.online_members.indexOf(user._id) !== -1) {
                            room.online_members.splice(room.online_members.indexOf(user._id), 1);
                            room.markModified('propChanged');

                            room.save(function (err) {
                                if(err) throw err;
                            });

                        }
                    }
                });
            })();
        }
    });

    db.Room.findOne({_id: room_id}).exec(function (err, room) {
       if(err) throw err;

       res.send(JSON.stringify(room));
    });
});

app.post('/disconnect', function (req, res) {
    var user_id = req.body.user_id;
    db.User.findOne({_id: user_id}).exec(function(err, user){
        if(err) throw err;

        for(var i = 0; i > user.rooms.length; i++){
            (function(){
                var room_id = user.rooms[i];
                db.Room.findOne({_id: room_id}).exec(function(err, room){
                    if(err) throw err;

                    if(room.online_members.indexOf(user._id) !== -1){
                        room.online_members.splice(room.online_members.indexOf(user._id), 1);
                        room.markModified('propChanged');
                    }
                });
                db.Room.findOne({_id: room._id}).exec(function(err, rm){
                });
            })();
        }

        res.sendStatus(200);
    });
});

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    db.User.find({username: username}).exec(function (err, usersFound) {
        if (err) console.error.bind(console, "MongoDB error");

        if (usersFound.length > 0) {
            res.sendStatus(403);
        } else {
            db.Room.findOne({room_name: 'Public Room'}).exec(function (err, room) {
                if (err) console.error.bind(console, "MongoDB Error: ");
                if (room) {
                    var new_user = new db.User({
                        username: username,
                        password: password,
                        rooms: []
                    });
                    new_user.rooms.push(room);
                    new_user.save(function (err) {
                        if (err) console.error.bind(console, "MongoDB Save Error: ");
                        db.User.findOne({username: username}).exec(function (err, user) {
                            if (err) console.error.bind(console, "MongoDB Error: ");
                            var response = Object.assign({}, user._doc);
                            delete response.password;
                            res.send(JSON.stringify(response));
                        });
                    });
                } else {
                    res.sendStatus(404);
                }
            });
        }
    });
});

app.post('/log/', function (req, res) {
    var obj = req.body.obj;

    db.Room.findOne({_id: req.body.room_id}).exec(function (err, room) {
       if(err) throw err;
       if(room){
           room.log.push(obj);
           room.markModified('propChanged');
           room.save();
       }
    });

    db.Room.findOne({_id: req.param.room_id}).exec(function(err, rm){
    });
    res.sendStatus(200);
});

app.post('/newRoom', function(req, res){
    var room_name = req.body.room_name;
    var user_id = req.body.user_id;

    db.Room.findOne({room_name: room_name}).exec(function (err, room) {
        if(err) throw err;
        console.log(room);
        if(room){
            res.sendStatus(403);
        } else {
            var newRoom = new db.Room({
                room_name: room_name,
                log: [],
                online_members: []
            });
            newRoom.save(function (err) {
                if (err) throw err;
            });

            db.User.findOne({_id: user_id}).exec(function (err, user) {
                if(err) throw err;
                user.rooms.push(newRoom);
                user.markModified('propChanged');

                user.save(function (err) {
                    if(err) throw err;
                });

                res.send(JSON.stringify(newRoom));
            });
        }
    });
});

app.post('/joinRoom', function (req, res) {
    var room_name = req.body.room_name;
    var user_id = req.body.user_id;

    db.Room.findOne({room_name: room_name}).exec(function (err, room) {
        if(err) throw err;
        if (room) {

            db.User.findOne({_id: user_id}).exec(function (err, user) {
                if (err) throw err;

                console.log(user.rooms);
                var roomExists = false;

                for(var i = 0; i < user.rooms.length && !roomExists; i++){
                    (function () {
                        roomExists = (roomExists)?true:(user.rooms[i]._id.equals(room._id));
                    })();
                }

                if (roomExists) {
                    res.sendStatus(403);
                } else {
                    user.rooms.push(room);
                    user.markModified('propChanged');

                    user.save(function (err) {
                        if (err) throw err;
                    });

                    res.send(JSON.stringify(room));
                }
            });
        } else {
            res.sendStatus(404);
        }
    });

});

app.use('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/psyke.html'));
});

// app.use('/peer', ExpressPeerServer(server, options));

module.exports = app;

server.on('connection', function (id) {
});
server.on('disconnect', function (id) {});

console.log('listening on: localhost:' + PORT);
// server.listen(PORT);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}
