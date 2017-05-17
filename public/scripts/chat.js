/**
 * Created by tfeue on 5/17/2017.
 */
var connections = {};
var peer;
$(document).ready(function () {
    $('chatbox').hide();

    var room_id = $('#room-id').val();
    var user_id = $('#user-id').val();
    var username = $('#username').val();
    var user_input = $('#user-input');
    var messages = $('#messages');

    peer = new Peer({
        host: window.location.hostname,
        port: window.location.port,
        path: '/peer'
    });

    peer.on('connection', function (conn) {
        console.log('PeerID ' + conn.peer + ' is trying to connect');
        console.log(conn);
        if (connections[conn.peer] === undefined || connections[conn.peer] === null) {
            connections[conn.peer] = conn;
            console.log(connections);
        } else {
            console.warn('PeerID ' + conn.peer + ' already connected');
        }
    });

    peer.on('error', function (err) {
       console.log(err);
    });

    peer.on('call', function (call) {
        //call.answer(window.localStream);
        console.log('Somebody is calling');
    });

    peer.on('open', function () {
        console.log('Local peer just opened');
    });

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getUserMedia({audio: true, video: false}, function (stream) {
        // Set your video displays
        // $('#my-video').prop('src', URL.createObjectURL(stream));
        window.localStream = stream;

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
                    if(v !== user_id){
                        console.log('Attempting to connect to ' + v);
                        connections[v] = peer.connect(v);

                        connections[v].on('data', function (d) {
                            var data = JSON.parse(d);
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
                                    console.log(d);
                                    break;
                            }
                        });


                        connections[v].on('open', function () {
                            connections[v].send('ASDF');
                        });
                        connections[v].send('ASDF2');
                    }
                });

                console.log(connections);

                $('#chatbox').show();
            }
        });

    }, function () {
        if (confirm('Something went wrong with your input devices.\nTry again?')) {
            window.location.reload();
        }
    });

});