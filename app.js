// const PORT = 8080;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ExpressPeerServer = require('peer').ExpressPeerServer;

var index = require('./routes/index');
var users = require('./routes/users');
var db = require('./routes/db');

var CryptoJS = require("crypto-js");
var secret = 'brad has nine toes';
var app = express();

var PORT = normalizePort(process.env.port || '8080');

app.set('port', PORT);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/test', function (req, res) {
//     res.sendFile(path.join(__dirname, 'views/test.html'));
// });
// app.use('/', index);
// app.use('/users', users);
// app.get('/test', function (req, res) {
//     res.render('test', {title: 'test page'});
// });
//
// app.get('/rooms', function (req, res) {
//     res.render('rooms', {title: 'rooms test'});
// });
// var test_rooms = {
//     'room1': {
//         id: 'room1',
//         name: 'Room 1',
//         online_members: {}
//     },
//     'secondroom':{
//         id:'secondroom',
//         name: 'Second Room',
//         online_members: {}
//     }
// };
// var test_users = {
//     'admin': {
//         user_id: 'admin',
//         username: 'admin',
//         password: 'password',
//         rooms: [
//             'room1',
//             'secondroom'
//         ]
//     }
// };
/* Thomas's testing code, feel free to change /test into a pug page, just make sure it does the same thing */

var server = app.listen(PORT);

var options = {
    debug: true
};

/************************************/


app.post('/login', function (req, res) {
    console.log('reached /login!');


    db.User.findOne({username: req.body.username}).exec(function (err, user) {
        if (err) throw err;

        if (user !== null) {
            console.log('user found');
            console.log(user);
            console.log(user.password);
            console.log(req.body.password);
            if (user.password === CryptoJS.AES.encrypt(req.body.password, secret)) {
                console.log('passwords match!');
                var response = Object.assign({}, user.toJSON());
                delete response.password;
                response._id = user._id;
                console.log(response);
                res.send(JSON.stringify(response));
            } else {
                console.log('invalid password');
                res.sendStatus(503);
            }
        } else {
            console.log('user not found');
            res.sendStatus(403);
        }

    });
});

// function User(username, password, id){
//     return {
//         username: username,
//         password: password,
//         id: id,
//         rooms: ['public']
//     }
// }
//
// app.post('/getUserRooms', function(req, res){
//     var user_id = req.body.user_id;
//     db.User.fin
// });

app.post('/connect', function (req, res) {
    var room_id = req.body.room_id;
    var user_id = req.body.user_id;
    console.log("uid::",user_id);
    console.log("rid::",room_id);

    db.User.findOne({_id: user_id}).exec(function (err, user) {
        if (err) throw err;
        // var user = u.toJSON();
        for (var i = 0; i < user.rooms.length; i++) {
            (function () {
                var r_id = user.rooms[i]._id;
                db.Room.findOne({_id: r_id}).exec(function (err, room) {
                    if (err) throw err;


                    // console.log(rm);
                    // var room = rm.toJSON();
                    console.log(room);

                    if (room) {
                        console.log(room._id.toString(), typeof room._id.toString());
                        console.log(room_id, typeof room_id);

                        console.log(room._id.toString()===room_id);
                        if (room._id.toString()===room_id && room.online_members.indexOf(user._id) === -1) {
                            room.online_members.push(user._id);
                            room.markModified('propChanged');

                            room.save(function (err) {
                                if(err) throw err;
                                console.log('saved');
                            });
                            // db.Room.update(
                            //     {_id: room_id},
                            //     {$push: { online_members: user_id}}
                            // );
                            console.log('1');
                        } else if (room._id.toString() !== room_id && room.online_members.indexOf(user._id) !== -1) {
                            console.log('2');
                            room.online_members.splice(room.online_members.indexOf(user._id), 1);
                            room.markModified('propChanged');

                            room.save(function (err) {
                                if(err) throw err;
                                console.log('saved');
                            });
                            // db.Room.update(
                            //     {_id: room_id, online_members: user_id},
                            //     {$set: {"grades.$": null}}
                            // );
                        } else if(room._id.toString()===room_id && room_id && room.online_members.indexOf(user._id) !== -1){
                            console.log('user is already in this room');
                        } else {
                            console.log("user wasn't in this room");
                        }


                        // db.Room.findById(room._id, function(err, doc){
                        //     if(err) throw err;
                        //     doc.online_members = room.online_members;
                        //     doc.save();
                        // });
                        //
                        // db.Room.findOne({_id: room._id}).exec(function (err, r) {
                        //     if(err) throw err;
                        //     console.log(r.toJSON());
                        // });
                        // // rm.
                        // room.save(function (err, doc) {
                        //     if(err) throw err;
                        //     console.log(room);
                        //     console.log(doc);
                        // });
                    } else {
                        console.log('Shit hit the fan');
                        // throw err;
                    }
                });
            })();
        }
    });

    db.Room.findOne({_id: room_id}).exec(function (err, rm) {
       if(err) throw err;
       var room = rm.toJSON();

       res.send(JSON.stringify(room));
    });
});

app.post('/disconnect', function (req, res) {
    console.log('/disconnect/');
    var user_id = req.body.user_id;
    db.User.findOne({_id: user_id}).exec(function(err, usr){
        if(err) throw err;

        var user = usr.toJSON();

        for(var i = 0; i > user.rooms.length; i++){
            (function(){
                var room_id = user.rooms[i];
                db.Room.findOne({_id: room_id}).exec(function(err, oorm){
                    if(err) throw err;
                    // var room = rm.toJSON();

                    if(room.online_members.indexOf(user._id) !== -1){
                        room.online_members.splice(room.online_members.indexOf(user._id), 1);
                        room.markModified('propChanged');
                    }
                });
                db.Room.findOne({_id: room._id}).exec(function(err, rm){
                    console.log(rm);
                });
            })();
        }

        res.sendStatus(200);
    });
    // var user_id = req.body.user_id;
    // var user = db.users[user_id];
    // if (user !== undefined) {
    //     var i;
    //     for (i = 0; i < user.rooms.length; i++) {
    //         var t_room = db.rooms[user.rooms[i]];
    //         if (t_room.online_members.indexOf(user_id) != -1) {
    //             t_room.online_members.splice(t_room.online_members.indexOf(user_id), 1);
    //         }
    //     }
    // }
    // res.sendStatus(200);
    // res.sendStatus(500);
});

app.post('/getRoom', function (req, res) {
    // var room = db.rooms[req.body.room_id];
    // room.users = {};
    // var i;
    // for (i = 0; i < room.online_members; i++) {
    //     var user_id = room.online_members[i];
    //     var t_user = Object.assign({}, db.users[user_id]);
    //     delete t_user.password;
    //     room.users[user_id] = t_user;
    // }
    //
    // res.send(JSON.stringify(room));
    res.sendStatus(500);
});

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = CryptoJS.AES.encrypt(req.body.password, secret);
    db.User.find({username: username}).exec(function (err, usersFound) {
        if (err) console.error.bind(console, "MongoDB error");

        if (usersFound.length > 0) {
            res.sendStatus(403);
        } else {
            db.Room.findOne({room_name: 'Public Room'}).exec(function (err, rm) {
                room = rm.toJSON();
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
                        console.log("User Registered!");
                        // console.log(this === new_user);
                        // res.sendStatus(503);
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
    console.log('');
});

app.post('/log/', function (req, res) {
    console.log('/log');
    console.log('room_id: ', req.body.room_id);
    console.log('obj: ', req.body.obj);

    //for testing porpoises
    res.sendStatus(200);
});

app.post('/newRoom', function(req, res){
    var room_name = req.body.room_name;
    var user_id = req.body.user_id;

    db.Room.findOne({room_name: room_name}).exec(function (err, room) {
        if(err) throw err;

        if(room){
            console.log("Room already exists");
            res.sendStatus(403);
        } else {
            var newRoom = new db.Room({
                room_name: room_name,
                log: [],
                online_members: []
            });
            newRoom.save(function (err) {
                if (err) throw err;
                console.log('Saved a room');
            });

            console.log('330: ',newRoom);

            db.User.findOne({_id: user_id}).exec(function (err, user) {
                if(err) throw err;
                user.rooms.push(newRoom);
                user.markModified('propChanged');

                user.save(function (err) {
                    if(err) throw err;
                    console.log('new room saved to user');
                });

                res.send(JSON.stringify(newRoom));
            });
        }
    });
});
/* put all the app.get app.post and app.use above this line */

app.use('/offline_development', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/offline.html'));
});

app.use('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/psyke.html'));
});
/************************************/

// app.get('/multichat_login/', function (req, res) {
//     res.render('multichat_login',
//         {
//             title: 'multichat_login',
//             user: test_users['admin']
//         });
// });
//
// app.get('/multichat', function (req, res) {
//     res.sendFile(path.join(__dirname, 'views/multichat.html'));
// });
//
// app.post('/join_multichat', function (req, res) {
//     console.log(req.body.user_id);
//     console.log(req.body.username);
//     console.log(req.body.password);
//     var user = test_users[req.body.user_id];
//
//     if(user === undefined){
//         console.log('show error: undefined');
//         res.redirect('/multichat_login/');
//     } else {
//         if(req.body.password === user.password){
//             console.log('login');
//             res.cookie(
//                 'user',
//                 JSON.stringify({
//                     user_id: user.user_id,
//                     username: user.username,
//                     rooms: user.rooms
//                 }),
//                 {
//                     maxAge: 9000000
//                 });
//             res.redirect('/multichat');
//         } else {
//             console.log('show error: bad pass');
//             res.redirect('/multichat_login/');
//         }
//     }
// });
//
// app.post('/join_room/:room_id/:user_id', function (req, res) {
//     var user_id = req.params.user_id;
//     var room_id = req.params.room_id;
//
//     console.log('room_id: ' + room_id);
//     console.log('user_id: ' + user_id);
//
//     var new_user = {
//         id: user_id,
//         name: user_id.substr(0, 5)
//     };
//
//     test_rooms[room_id].online_members[user_id] = new_user;
//
//     console.log(JSON.stringify(test_rooms[room_id], '\n'));
//
//     res.cookie('user', new_user, {maxAge: 9000000});
//     res.cookie('room_id', room_id, {maxAge: 1000 * 60 * 2});
//
//     res.redirect('/chat');
//     // res.render('chat', { title: 'chat test', room_id: req.params.room_id, user_id: req.params.user_id });
// });
//
// app.get('/chat', function (req, res) {
//     var room_id = req.cookies['room_id'];
//     var user = req.cookies['user'];
//
//     if (room_id === null || room_id === undefined || user === null || user === undefined) {
//         //throw error
//         res.redirect('/rooms');
//     } else {
//         res.render('chat', {title: 'chat test', room_id: room_id, user_id: user.id, username: user.name});
//     }
// });
//
// app.get('/getRooms', function (req, res) {
//
//     var i, getRooms = [];
//
//     for (i = 0; i < Object.keys(test_rooms).length; i++) {
//         getRooms[i] = {
//             id: Object.keys(test_rooms)[i],
//             name: test_rooms[Object.keys(test_rooms)[i]].name
//         }
//     }
//
//     res.send(JSON.stringify(getRooms));
// });
//
// app.get('/getRoom/:room_id', function (req, res) {
//     console.log(req.params.room_id);
//
//     console.log(JSON.stringify(test_rooms[req.params.room_id], '\n'));
//
//     res.send(JSON.stringify(test_rooms[req.params.room_id]));
// });
//
// app.post('/updateRoom/:room_id', function (req, res) {
//     var room = JSON.parse(req.body.room);
//     console.log('update Room');
//     console.log(room);
//     test_rooms[req.params.room_id] = room;
//     res.sendStatus(200);
// });

/*Don't mess with this line or use any routes called 'peer' or this will break*/
app.use('/peer', ExpressPeerServer(server, options));

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });
//
// // error handler
// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// });

module.exports = app;

server.on('connection', function (id) {
    // console.log(id);
    // id.send('test');
    // console.log('============================================================');

    console.log('Someone connected');
});
server.on('disconnect', function (id) {
    //console.log(id);
    console.log('Someone disconnected');
});

console.log('listening on: localhost:' + PORT);
server.listen(PORT);

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
