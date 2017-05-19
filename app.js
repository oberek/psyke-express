const PORT = 8080;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ExpressPeerServer = require('peer').ExpressPeerServer;

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

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

/* Thomas's testing code, feel free to change /test into a pug page, just make sure it does the same thing */
// app.get('/test', function (req, res) {
//     res.sendFile(path.join(__dirname, 'views/test.html'));
// });

app.use('/', index);
app.use('/users', users);
app.get('/test', function (req, res) {
    res.render('test', {title: 'test page'});
});

app.get('/rooms', function (req, res) {
    res.render('rooms', {title: 'rooms test'});
});

var server = app.listen(PORT);

var options = {
    debug: true
};

var test_rooms = {
    'room1': {
        id: 'room1',
        name: 'Room 1',
        members: {}
    },
    'secondroom':{
        id:'secondroom',
        name: 'Second Room',
        members: {}
    }
};

app.post('/join_room/:room_id/:user_id', function (req, res) {
    var user_id = req.params.user_id;
    var room_id = req.params.room_id;

    console.log('room_id: ' + room_id);
    console.log('user_id: ' + user_id);

    var new_user = {
        id: user_id,
        name: user_id.substr(0, 5)
    };

    test_rooms[room_id].members[user_id] = new_user;

    console.log(JSON.stringify(test_rooms[room_id], '\n'));

    res.cookie('user', new_user, {maxAge: 9000000});
    res.cookie('room_id', room_id, {maxAge: 1000 * 60 * 2});

    res.redirect('/chat');
    // res.render('chat', { title: 'chat test', room_id: req.params.room_id, user_id: req.params.user_id });
});

app.get('/chat', function (req, res) {
    var room_id = req.cookies['room_id'];
    var user = req.cookies['user'];

    if (room_id === null || room_id === undefined || user === null || user === undefined) {
        //throw error
        res.redirect('/rooms');
    } else {
        res.render('chat', {title: 'chat test', room_id: room_id, user_id: user.id, username: user.name});
    }
});

app.get('/getRooms', function (req, res) {

    var i, getRooms = [];

    for (i = 0; i < Object.keys(test_rooms).length; i++) {
        getRooms[i] = {
            id: Object.keys(test_rooms)[i],
            name: test_rooms[Object.keys(test_rooms)[i]].name
        }
    }

    res.send(JSON.stringify(getRooms));
});

app.get('/getRoom/:room_id', function (req, res) {
    console.log(req.params.room_id);

    console.log(JSON.stringify(test_rooms[req.params.room_id], '\n'));

    res.send(JSON.stringify(test_rooms[req.params.room_id]));
});

app.post('/updateRoom/:room_id', function (req, res) {
    var room = JSON.parse(req.body.room);
    console.log('update Room');
    console.log(room);
    test_rooms[req.params.room_id] = room;
    res.sendStatus(200);
});

/*Don't mess with this line or use any routes called 'peer' or this will break*/
app.use('/peer', ExpressPeerServer(server, options));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

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

//server.listen(PORT);

//console.log('listening on: ' + process.env.IP + ':' + process.env.PORT);
console.log('listening on: localhost:' + PORT);
server.listen(PORT);
