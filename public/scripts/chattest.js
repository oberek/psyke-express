/**
 * Created by tfeue on 5/16/2017.
 */
var room = null;
var connections = {};
var calls = {};

var synchrotron;

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


    $(document).on('beforeunload', function (e) {
        console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });
    // (e || window.event).returnValue = null;

    $(document).on('unload', function (e) {
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

    function step2() {
        $.ajax({
            url: window.location.protocol + '/getRoom/' + room_id,
            success: function (data) {
                $('#loading').hide();
                room = JSON.parse(data);

                $('#message-box').on('submit', function (e) {
                    e.preventDefault();

                    var msg = user_input.val();
                    broadcast(msg);
                    user_input.val('');
                });

                // synchrotron = setInterval(function () {
                //     // console.log('sync');
                //     const memberCount = Object.keys(room.members).length;
                //     // console.log(memberCount);
                //     $.each(Object.keys(room.members), function (i, v) {
                //         // console.log(v);
                //         if (v !== user_id) {
                //             if (Object.keys(room.members).indexOf(v) >= 0) {
                //                 if (!connections[v].open) {
                //                     // console.log('connection is closed::'+v);
                //                     // console.log(connections[v].open);
                //                     dropUser(v);
                //                 }
                //             } else {
                //                 dropUser(v);
                //             }
                //         }
                //     });
                //
                //     // console.log(Object.keys(room.members).length);
                //
                //     if (memberCount !== Object.keys(room.members).length) {
                //
                //         $.ajax({
                //             url: window.location.protocol + '/getRoom/' + room_id,
                //             success: function (data) {
                //                 room = JSON.parse(data);
                //             }
                //         });
                //     }
                //
                // }, 2 * 1000);

                // clearInterval(synchrotron);

                console.log(room);
                $.each(Object.keys(room.members), function (i, v) {
                    var mem = room.members[v];

                    addUser(mem);

                    console.log(mem.id + ':::' + user_id);

                    if (mem.id === user_id) {
                        console.log('cannot connect to self');
                    } else {
                        console.log('Attempting connection to ' + mem.id);
                        var conn = peer.connect(mem.id);
                        connections[mem.id] = conn;
                        conn.on('open', function () {
                            conn.on('data', function (data) {
                                console.log(data);
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
                                    default:
                                        break;
                                }
                            });

                            conn.on('close', function () {
                                console.log(this.peer + ' has left the chat');
                                dropUser(this.peer);
                                //post data to server
                                //moved inot the dropUser function
                                // $.ajax({
                                //     url: window.location.protocol + '/updateRoom/' + room_id,
                                //     type: 'post',
                                //     data: {
                                //         room: JSON.stringify(room)
                                //     },
                                //     dataType: 'json',
                                //     success: function (data) {
                                //         console.log(data);
                                //     }
                                // });
                            });

                            conn.on('error', function (err) {
                                console.log(err);
                            });
                        });
                        //calls[mem.id] = peer.call(v.mem, window.localStream);
                    }
                });

                $('#chatbox').show();

                peer.on('connection', function (conn) {
                    console.log('PeerID ' + conn.peer + ' is trying to connect');
                    console.log(connections[conn.peer]);
                    if (connections[conn.peer] === undefined || connections[conn.peer] === null) {
                        connections[conn.peer] = conn;
                        conn.on('open', function () {
                            conn.on('data', function (data) {
                                console.log(data);
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
                                    default:
                                        break;
                                }
                            });

                            conn.send({type: 'info-request', user_id: user_id});
                        });
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
                // peer.on('data', function (data) {
                //     console.log(data);
                // });


            }
        });
    }

});