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
    // console.log('reached /login!');
    var users = Object.keys(db.users);
    var i;
    var user = false;
    for (i = 0; i < users.length && !user; i++) {
        if (!user) {
            var t_user = db.users[users[i]];
            if (t_user.username === req.body.username && t_user.password === req.body.password) {
                user = Object.assign({}, t_user);
                delete user.password;
                res.send(JSON.stringify({result: user}));
            }
        }
    }
    if(!user){
        res.sendStatus(503);
    }
});

function User(username, password, id){
    return {
        username: username,
        password: password,
        id: id,
        rooms: ['public']
    }
}

app.post('/register', function (req, res) {

    function makeID() {
        var text = '';
        /*preventing line length from going above 80*/
        var lowercase = 'abcdefghijklmnopqrstuvwxyz';
        var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var numbers = '0123456789';

        var possible = uppercase + lowercase + numbers;
        for (var i = 0; i < 16; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
    // console.log('reached /login!');
    // var users = Object.keys(db.users);
    // var i;
    // var user = false;
    // for (i = 0; i < users.length && !user; i++) {
    //     if (!user) {
    //         alert("You already have an account!!");
    //         //res.redirect("/login");
    //     }
    // }
    // if(!user){
    //     res.render('register')
    // }

    var username = req.body.username;
    var password = req.body.password;

    console.log(username+"::"+password);

    var userFound = false;
    var i;
    var user_ids = Object.keys(db.users);
    for(i = 0; i < user_ids.length && !userFound; i++){
        if(db.users[user_ids[i]].username === username){
            userFound = true;
        }
    }

    if (userFound) {
        res.sendStatus(503);
    } else {
        var id = makeID();

        while (db.users[id] !== undefined) {
            id = makeID();
        }

        db.users[id] = User(username, password, id);

        var out = Object.assign({}, db.users[id]);
        delete out.password;

        res.send(JSON.stringify({result: out}));
    }



    // db.users[id] =

    /*Create random id*/
    /**/
});

app.post('/connect', function (req, res) {
    var room_id = req.body.room_id;
    var user_id = req.body.user_id;

    if (db.rooms[room_id] !== undefined && db.users[user_id] !== undefined) {
        var user = db.users[user_id];
        if (user.rooms.includes(room_id)) {
            var i;
            for (i = 0; i < user.rooms.length; i++) {
                var t_room = db.rooms[user.rooms[i]];
                console.log(t_room.room_id);
                if (t_room.room_id === room_id && !t_room.online_members.includes(user_id)) {
                    t_room.online_members.push(user_id);
                } else if (t_room.online_members.includes(user_id)) {
                    console.log(t_room.online_members);
                    t_room.online_members.splice(t_room.online_members.indexOf(user_id), 1);
                    console.log(t_room.online_members);
                } else {
                    console.log('user wasn\'t in this room');
                    console.log(t_room.online_members);
                }
            }
        } else {
            console.log('1st err');
            res.sendStatus(503);
        }
    } else {
        console.log('2nd err');
        res.sendStatus(503);
    }

    var room = db.rooms[room_id];

    res.send(JSON.stringify(room));
});

app.post('/disconnect', function (req, res) {
    console.log('/disconnect/');
    var user_id = req.body.user_id;
    var user = db.users[user_id];
    if (user !== undefined) {
        var i;
        for (i = 0; i < user.rooms.length; i++) {
            var t_room = db.rooms[user.rooms[i]];
            if (t_room.online_members.includes(user_id)) {
                t_room.online_members.splice(t_room.online_members.indexOf(user_id), 1);
            }
        }
    }
    res.sendStatus(200);
});

app.post('/getUserRooms', function (req, res) {
    var room_ids = db.users[req.body.user_id].rooms;
    var rooms = [];
    var i;
    console.log('Getting rooms');
    for (i = 0; i < room_ids.length; ++i) {
        var rm = Object.assign({}, db.rooms[room_ids[i]]);
        delete rm.log;
        rooms.push(rm);
    }
    // console.log(rooms);
    res.send(JSON.stringify(rooms));
});

app.post('/getRoom', function (req, res) {
    var room = db.rooms[req.body.room_id];
    room.users = {};
    var i;
    for (i = 0; i < room.online_members; i++) {
        var user_id = room.online_members[i];
        var t_user = Object.assign({}, db.users[user_id]);
        delete t_user.password;
        room.users[user_id] = t_user;
    }

    res.send(JSON.stringify(room));
});

app.post('/log/', function (req, res) {
    console.log('/log');
    console.log('room_id: ',req.body.room_id);
    console.log('obj: ',req.body.obj);

    //for testing porpoises
    res.sendStatus(200);
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
