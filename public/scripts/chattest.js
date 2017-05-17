/**
 * Created by tfeue on 5/16/2017.
 */
var room = null;
var connections = {};
var calls = {};

$(document).ready(function () {
    $('chatbox').hide();
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getUserMedia({audio: true, video: false}, function (stream) {
        // Set your video displays
        // $('#my-video').prop('src', URL.createObjectURL(stream));
        window.localStream = stream;
        step2();
    }, function () {
        if (confirm('Something went wrong with your input devices.\nTry again?')) {
            window.location.reload();
        }
    });

    var room_id = $('#room-id').val();
    var user_id = $('#user-id').val();
    var username = $('#username').val();

    var user_input = $('#user-input');
    var messages = $('#messages');

    var peer = new Peer(user_id, {
        host: window.location.hostname,
        port: window.location.port,
        path: '/peer'
    });

    function sendDisconnect() {
        $.each(Object.keys(room.members), function (i, v) {
           if(v !== user_id){
               v.send({type: 'disconnect', user_id: user_id});
           }
        });
    }


    $(document).on('beforeunload', function (e) {
        sendDisconnect();
        console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });
    // (e || window.event).returnValue = null;

    $(document).on('unload', function (e) {
        sendDisconnect();
        console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });

    function addUser(mem) {
        $('#users').append($('<li class="user" id="user-' + mem.id + '">').text(mem.name));
    }

    function dropUser(id) {
        console.log(id);
        delete room.members[id];
        delete connections[id];
        $('#user-' + id).remove();

        $.ajax({
            url: window.location.protocol + '/updateRoom/' + room_id,
            type: 'post',
            data: {
                room: JSON.stringify(room)
            },
            dataType: 'json',
            success: function (data) {
                console.log(data);
            }
        });
    }

    function addConnEventListeners(conn){
        conn.on('data', function (data) {
            console.log(data);
            decodeData(data);
        });

        conn.on('close', function () {
            console.log(this.peer + ' has left the chat');
            dropUser(this.peer);
        });

        conn.on('error', function (err) {
            console.log(err);
        });
    }

    function addDataConnection(conn){
        console.log('Adding dataConneciton for ' + conn.peer);
        console.log(conn);
        if(conn.open){
            console.log(conn.peer + '\'s connection is already open');
            addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: user_id});
        } else {
            console.log('Waiting for ' + conn.peer + ' to open connection');
            addConnEventListeners(conn);
            conn.on('open', function () {
                console.log(conn.peer + ' has opened');
                addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: user_id});
            });
        }
    }

    function postMessage(data) {
        messages.append($('<li class="message">').text(room.members[data.user_id].name + ': ' + data.content));
    }

    function broadcast(msg) {
        var data = {
            type: 'message',
            user_id: user_id,
            content: msg
        };
        postMessage(data);
        $.each(Object.keys(connections), function (i, v) {
            connections[v].send(data);
        });
    }

    var sync = function(room, user_id){
        const memberCount = Object.keys(room.members).length;
        $.each(Object.keys(room.members), function (i, v) {
            if (v !== user_id) {
                if (Object.keys(room.members).indexOf(v) >= 0) {
                    if(connections[v] === undefined){
                        dropUser(v);
                    } else {
                        if (!connections[v].open) {
                            dropUser(v);
                        }
                    }
                } else {
                    dropUser(v);
                }
            }
        });
    };

    function decodeData(data){
        console.log("Data: "+data);
        switch (data.type) {
            case 'info-request':
                connections[data.user_id].send({
                    type: 'info-response',
                    user_id: user_id,
                    content: {
                        id: user_id,
                        name: username
                    }
                });
                break;
            case 'info-response':
                room.members[data.user_id] = data.content;
                addUser(data.content);
                break;
            case 'message':
                postMessage(data);
                break;
            case 'disconnect':
                console.log(data.user_id + ' requested disconnect');
                dropUser(data.user_id);
                break;
            default:
                console.log(data);
                break;
        }
    }

    function step2() {
        $.ajax({
            url: window.location.protocol + '/getRoom/' + room_id,
            success: function (data) {
                $('#loading').remove();
                room = JSON.parse(data);

                $('#room-name').text(room.name);

                $('#message-box').on('submit', function (e) {
                    e.preventDefault();

                    var msg = user_input.val();
                    broadcast(msg);
                    user_input.val('');
                });

                console.log(room);
                $.each(Object.keys(room.members), function (i, v) {
                    var mem = room.members[v];

                    addUser(mem);

                    if (mem.id !== user_id) {
                        console.log('Attempting connection to ' + mem.id);
                        var conn = peer.connect(mem.id);

                        console.log(peer.connections);

                        connections[mem.id] = conn;
                        addDataConnection(conn);
                        //calls[mem.id] = peer.call(v.mem, window.localStream);
                    }
                });

                $('#chatbox').show();

                peer.on('connection', function (conn) {
                    console.log('PeerID ' + conn.peer + ' is trying to connect');
                    console.log(connections[conn.peer]);
                    if (connections[conn.peer] === undefined || connections[conn.peer] === null) {
                        connections[conn.peer] = conn;
                        addDataConnection(conn);
                    } else {
                        console.warn('PeerID ' + conn.peer + ' already connected');
                    }
                });

                peer.on('call', function (call) {
                    //call.answer(window.localStream);
                    console.log('Somebody is calling');
                });

                peer.on('disconnect', function () {
                    console.log('You have been disconnected.');
                });
            }
        });
    }
});