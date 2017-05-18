/**
 * Created by tfeue on 5/16/2017.
 */
var room = null;
var connections = {};
var calls = {};
var useVoice = false;

$(document).ready(function () {
    $('chatbox').hide();
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getUserMedia({audio: true, video: false}, function (stream) {
        // Set your video displays
        // $('#my-video').prop('src', URL.createObjectURL(stream));
        useVoice = true;
        window.localStream = stream;
        step2();
    }, function () {
        if (confirm('Something went wrong with your input devices.\nDo you want to continue without audio?')) {
            step2();
        } else {
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
            if (v !== user_id) {
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
        if (useVoice) {
            var call = peer.call(mem.id, window.localStream);
            calls[mem.id] = call;
            addCallStream(call);
        }
    }

    function addCallStream(call) {
        console.log('Call');
        console.log(call);
        if(calls[call.peer] === undefined) {
            calls[call.peer] = call;
            // call.answer();
            call.answer(window.localStream);

            console.log('waiting for stream');
            call.on('stream', function (stream) {
                console.log('stream established');
                user_li.append($('<audio controls class="hidden userstream" id="audio-' + call.peer + '" src="' + URL.createObjectURL(stream) + '" autoplay=""></audio>'));
                var stream_controls = $('<div class="stream-controls">');
                user_li.append(stream_controls);
            });

            call.on('close', function () {
                console.log(call.peer + ' has left voice chat');
            });
        }
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

    function addConnEventListeners(conn) {
        conn.on('data', function (data) {
            console.log(data);
            console.log((new Date).getTime());
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

    function addDataConnection(conn) {
        console.log((new Date).getTime());
        console.log('Adding dataConneciton for ' + conn.peer);
        console.log(conn);
        if (conn.open) {
            console.log(conn.peer + '\'s connection is already open');
            console.log((new Date).getTime());
            addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: user_id});
        } else {
            console.log('Waiting for ' + conn.peer + ' to open connection');
            // addConnEventListeners(conn);
            conn.on('open', function () {
                console.log((new Date).getTime());
                console.log(conn.peer + ' has opened');
                addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: user_id});
            });
        }
    }

    function autoScroll() {
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    function postError(err) {
        messages.append($('<li class="message error">').text('ERROR: ' + err.msg));
        autoScroll();
    }

    function postMessage(data) {
        messages.append($('<li class="message">').text(room.members[data.user_id].name + ': ' + data.content));
        autoScroll();
    }

    function postWhisper(whisper) {
        messages.append($('<li class="message whisper">').text(((whisper.sender === user_id) ? 'To' : 'From') + ' ' + ((whisper.sender === user_id) ? room.members[whisper.target].name : room.members[whisper.sender].name) + ': ' + whisper.content));
        autoScroll();
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

    var sync = function (room, user_id) {
        const memberCount = Object.keys(room.members).length;
        $.each(Object.keys(room.members), function (i, v) {
            if (v !== user_id) {
                if (Object.keys(room.members).indexOf(v) >= 0) {
                    if (connections[v] === undefined) {
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

    function decodeData(data) {
        console.log("Data: " + data);
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
            case 'whisper':
                postWhisper(data);
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

                    if (msg.indexOf('@') === 0) {
                        var splitter = msg.split(' ');
                        console.log(splitter);
                        if (splitter.length >= 2) {
                            if (splitter[0].length === 1) {
                                postError({msg: 'You must supply a username to whisper to.'});
                            } else {
                                var unam = splitter[0].substr(msg.indexOf('@') + 1);
                                console.log(unam);
                                if (unam === username) {
                                    postError({msg: 'You can\'t whisper to yourself'});
                                } else {
                                    var target = null;
                                    $.each(Object.keys(room.members), function (i, v) {
                                        var v_name = room.members[v].name;
                                        console.log(v_name);
                                        console.log(v_name === unam);
                                        if (target === null && v_name === unam) {
                                            target = room.members[v];
                                        }
                                    });
                                    if (target === null) {
                                        postError({msg: 'User not found.'});
                                    } else {
                                        var msg_content = msg.substr(msg.indexOf(splitter[1]));
                                        console.log(msg_content);
                                        var whisper = {
                                            type: 'whisper',
                                            content: msg_content,
                                            target: target.id,
                                            sender: user_id
                                        };
                                        postWhisper(whisper);
                                        connections[target.id].send(whisper);
                                    }
                                }
                            }
                        } else {
                            postError({msg: 'You must supply a message'});
                        }
                    }
                    else {
                        broadcast(msg);
                    }

                    user_input.val('');
                });

                console.log(room);

                addUser(room.members[user_id]);

                $.each(Object.keys(room.members), function (i, v) {
                    var mem = room.members[v];
                    // addUser(mem);
                    if (mem.id !== user_id) {
                        console.log('Attempting connection to ' + mem.id);
                        var conn = peer.connect(mem.id);
                        console.log(peer.connections);
                        connections[mem.id] = conn;
                        addDataConnection(conn);
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
                    if (useVoice) {
                        console.log(call.peer + ' is calling');
                        addCallStream(call);
                    } else {
                        call.close();
                    }
                });

                peer.on('disconnect', function () {
                    console.log('You have been disconnected.');
                });
            }
        });
    }
});
